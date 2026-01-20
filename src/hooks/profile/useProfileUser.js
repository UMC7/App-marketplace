import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import supabase from '../../supabase';

const useProfileUser = ({ currentUser, activeTab, setActiveTab }) => {
  const [userDetails, setUserDetails] = useState({});
  const [candidateEnabled, setCandidateEnabled] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState(
    currentUser?.app_metadata?.avatar_url || null
  );
  const [userForm, setUserForm] = useState({
    email: '',
    nickname: '',
    phone: '',
    phoneCode: '',
    altPhone: '',
    altPhoneCode: '',
    altEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [updateMessage, setUpdateMessage] = useState('');

  const nickname =
    userDetails?.nickname || currentUser?.app_metadata?.nickname || 'User';

  useEffect(() => {
    setLocalAvatarUrl(currentUser?.app_metadata?.avatar_url || null);
  }, [currentUser?.app_metadata?.avatar_url]);

  const setUserData = useCallback(
    (userData) => {
      if (!currentUser) return;
      setUserDetails(userData);
      setCandidateEnabled(!!userData?.is_candidate);

      const splitPhone = (fullPhone) => {
        if (!fullPhone) return { code: '', number: '' };

        const parsed = parsePhoneNumberFromString(fullPhone);
        if (!parsed) return { code: '', number: fullPhone };

        return {
          code: parsed.countryCallingCode,
          number: parsed.nationalNumber,
        };
      };

      const main = splitPhone(userData.phone);
      const alt = splitPhone(userData.alt_phone);

      setUserForm((prev) => ({
        ...prev,
        email: currentUser.email,
        nickname: userData.nickname || '',
        phone: main.number,
        phoneCode: main.code,
        altPhone: alt.number,
        altPhoneCode: alt.code,
        altEmail: userData.alt_email || '',
      }));
    },
    [currentUser]
  );

  const extractPathFromPublicUrl = (url) => {
    if (!url) return null;
    const m = url.match(/\/object\/public\/avatars\/(.+)$/);
    return m ? m[1] : null;
  };

  const handleRemoveAvatar = useCallback(async () => {
    try {
      const path = extractPathFromPublicUrl(localAvatarUrl);
      if (path) {
        const { error: delErr } = await supabase.storage
          .from('avatars')
          .remove([path]);
        if (delErr) {
          console.warn(
            'No se pudo borrar del storage (continuo):',
            delErr.message
          );
        }
      }

      const { error: dbErr } = await supabase
        .from('users')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);

      if (dbErr) {
        toast.error('Could not delete the photo.');
        return;
      }

      setLocalAvatarUrl(null);
      toast.success('Photo removed. We will use your nickname inside a circle.');
    } catch (e) {
      console.error(e);
      toast.error('An error occurred while removing the photo.');
    }
  }, [currentUser, localAvatarUrl]);

  const handleChangeAvatar = useCallback(
    async (e) => {
      try {
        const file = e.target.files?.[0];
        if (!file) return;

        const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!okTypes.includes(file.type)) {
          toast.error('Formato invケlido. Usa JPG, PNG o WEBP.');
          e.target.value = '';
          return;
        }
        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
          toast.error('Imagen muy grande. Mケx 5MB.');
          e.target.value = '';
          return;
        }

        const ext =
          file.type === 'image/png'
            ? 'png'
            : file.type === 'image/webp'
            ? 'webp'
            : 'jpg';
        const path = `${currentUser.id}/avatar_${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, file, {
            upsert: true,
            contentType: file.type,
          });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
        const avatarUrl = pub?.publicUrl;
        if (!avatarUrl) throw new Error('No se pudo obtener la URL pカblica.');

        const { error: dbErr } = await supabase
          .from('users')
          .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
          .eq('id', currentUser.id);
        if (dbErr) throw dbErr;

        setLocalAvatarUrl(avatarUrl);
        toast.success('Foto actualizada.');
      } catch (err) {
        console.error(err);
        toast.error('No se pudo cambiar la foto.');
      } finally {
        if (e?.target) e.target.value = '';
      }
    },
    [currentUser]
  );

  const handleUserFormChange = useCallback((e) => {
    const { name, value } = e.target;
    if (['phoneCode', 'phone', 'altPhoneCode', 'altPhone'].includes(name)) {
      const digitsOnly = value.replace(/\D/g, '');
      setUserForm((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }
    setUserForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleUserFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const confirm = window.confirm('Do you want to update your user information?');
      if (!confirm) return;

      setUpdateMessage('');

      const wantsEmailChange =
        userForm.email && userForm.email !== currentUser.email;
      const wantsPasswordChange =
        userForm.password && userForm.password.trim() !== '';

      if (wantsPasswordChange) {
        if (userForm.password !== userForm.confirmPassword) {
          const msg = 'Passwords do not match.';
          toast.error(msg);
          setUpdateMessage(msg);
          return;
        }
        const passwordRequirements = [];
        if (userForm.password.length < 8) {
          passwordRequirements.push('at least 8 characters');
        }
        if (!/[A-Z]/.test(userForm.password)) {
          passwordRequirements.push('one uppercase letter');
        }
        if (!/[a-z]/.test(userForm.password)) {
          passwordRequirements.push('one lowercase letter');
        }
        if (!/[0-9]/.test(userForm.password)) {
          passwordRequirements.push('one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(userForm.password)) {
          passwordRequirements.push('one special character');
        }
        if (passwordRequirements.length > 0) {
          const ruleMsg = `Password must contain ${passwordRequirements.join(', ')}.`;
          toast.error(ruleMsg);
          setUpdateMessage(ruleMsg);
          return;
        }
      }

      const wantsContactChange =
        (userForm.phone ?? '') !== (userDetails.phone ?? '') ||
        (userForm.altPhone ?? '') !== (userDetails.alt_phone ?? '') ||
        (userForm.altEmail ?? '') !== (userDetails.alt_email ?? '');

      const authUpdates = {};
      if (wantsEmailChange) authUpdates.email = userForm.email.trim();
      if (wantsPasswordChange) authUpdates.password = userForm.password;

      let samePwdWarning = false;
      let authChanged = false;
      let contactChanged = false;

      try {
        if (wantsEmailChange || wantsPasswordChange) {
          const { error: authError } = await supabase.auth.updateUser(authUpdates);

          if (authError) {
            const msg = (authError.message || '').toLowerCase();
            const isSamePwd =
              msg.includes('new password should be different') ||
              msg.includes('new password should be different from the old password');

            if (isSamePwd) {
              samePwdWarning = true;
              toast.info(
                'Password must be different from the current one. We will keep your current password.'
              );
            } else {
              throw authError;
            }
          } else {
            authChanged = true;
          }
        }

        if (wantsContactChange) {
          const fullPhone =
            userForm.phone && userForm.phoneCode
              ? `+${userForm.phoneCode}${userForm.phone}`
              : null;
          const fullAltPhone =
            userForm.altPhone && userForm.altPhoneCode
              ? `+${userForm.altPhoneCode}${userForm.altPhone}`
              : null;

          const { error: dbError } = await supabase
            .from('users')
            .update({
              phone: fullPhone,
              alt_phone: fullAltPhone,
              alt_email: userForm.altEmail || null,
            })
            .eq('id', currentUser.id);

          if (dbError) throw dbError;
          contactChanged = true;
        }

        if (contactChanged && samePwdWarning) {
          setUpdateMessage(
            'Contact details updated. Password unchanged because it matches your current one.'
          );
        } else if (contactChanged && authChanged) {
          setUpdateMessage('Information updated successfully.');
        } else if (contactChanged) {
          setUpdateMessage('Contact details updated.');
        } else if (authChanged) {
          setUpdateMessage('Account updated.');
        } else if (samePwdWarning) {
          setUpdateMessage('No changes saved. Choose a new password to update it.');
        } else {
          setUpdateMessage('No changes to save.');
        }

        setUserForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      } catch (error) {
        console.error('Failed to update information:', error.message);
        setUpdateMessage('Failed to update information.');
      }
    },
    [currentUser, userDetails, userForm]
  );

  const handleCandidateToggle = useCallback(
    async (e) => {
      const next = e.target.checked;
      try {
        const { error } = await supabase
          .from('users')
          .update({ is_candidate: next, updated_at: new Date().toISOString() })
          .eq('id', currentUser.id);
        if (error) throw error;
        setCandidateEnabled(next);
        if (!next && activeTab === 'cv') setActiveTab('usuario');
        toast.success(
          next ? 'Candidate profile enabled.' : 'Candidate profile disabled.'
        );
      } catch (err) {
        toast.error('Could not update Candidate profile setting.');
      }
    },
    [activeTab, currentUser, setActiveTab]
  );

  return {
    userDetails,
    candidateEnabled,
    localAvatarUrl,
    userForm,
    updateMessage,
    nickname,
    setUserData,
    handleChangeAvatar,
    handleRemoveAvatar,
    handleUserFormChange,
    handleUserFormSubmit,
    handleCandidateToggle,
  };
};

export default useProfileUser;
