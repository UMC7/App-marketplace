// src/pages/ProfilePage.js

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import { submitUserReview } from '../lib/reviewUtils';
import EditProductModal from '../components/EditProductModal';
import EditJobModal from '../components/EditJobModal';
import CandidateProfileTab from '../components/cv/CandidateProfileTab';
import ProfileProductsTab from '../components/profile/ProfileProductsTab';
import ProfileServicesTab from '../components/profile/ProfileServicesTab';
import ProfileJobsTab from '../components/profile/ProfileJobsTab';
import ProfileEventsTab from '../components/profile/ProfileEventsTab';
import ProfileDeletedTab from '../components/profile/ProfileDeletedTab';
import ProfileRatingsTab from '../components/profile/ProfileRatingsTab';
import ProfileSalesTab from '../components/profile/ProfileSalesTab';
import ProfilePurchasesTab from '../components/profile/ProfilePurchasesTab';
import ProfileUserTab from '../components/profile/ProfileUserTab';
import './ProfilePage.css';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  confirmPurchase,
  reportProblem,
  cancelPurchase,
} from '../lib/purchaseStatus';

const ALLOWED_TABS = new Set([
  'productos','servicios','empleos','eventos',
  'compras','ventas','eliminados','valoracion','usuario','cv'
]);

function ProfilePage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [updatedPurchaseStatuses, setUpdatedPurchaseStatuses] = useState({});
  const [services, setServices] = useState([]); // ✅ Nuevo estado para servicios
  const [jobOffers, setJobOffers] = useState([]);
  const [deletedJobs, setDeletedJobs] = useState([]);
  const [events, setEvents] = useState([]);
  
  const fetchEvents = async () => {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('owner', currentUser.id);

  if (error) {
    console.error('Error fetching events:', error.message);
  } else {
    setEvents(data);
  }
};
const fetchServices = async () => {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('owner', currentUser.id);

  if (error) {
    console.error('Error fetching services:', error.message);
  } else {
    setServices(data);
  }
};
  const [deletedEvents, setDeletedEvents] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [candidateEnabled, setCandidateEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('productos');
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [sentReviews, setSentReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 🔧 Para menú hamburguesa
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

const [localAvatarUrl, setLocalAvatarUrl] = useState(
  currentUser?.app_metadata?.avatar_url || null
);
const nickname = userDetails?.nickname || currentUser?.app_metadata?.nickname || 'User';

useEffect(() => {
  setLocalAvatarUrl(currentUser?.app_metadata?.avatar_url || null);
}, [currentUser?.app_metadata?.avatar_url]);

const navigate = useNavigate();
const location = useLocation();

const menuRef = useRef(null);
const isTab = (key) => (activeTab === key ? 'is-active' : '');

useEffect(() => {
  if (!isMenuOpen) return;
  const handler = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsMenuOpen(false);
    }
  };
  document.addEventListener('mousedown', handler);
  document.addEventListener('touchstart', handler, { passive: true });
  return () => {
    document.removeEventListener('mousedown', handler);
    document.removeEventListener('touchstart', handler);
  };
}, [isMenuOpen]);

useEffect(() => {
  const params = new URLSearchParams(location.search);

  const tab = params.get('tab');
  if (tab && ALLOWED_TABS.has(tab)) {
    setActiveTab(tab);
  }

  const refreshTarget = params.get('refresh');
  if (refreshTarget) {
    const refetchMap = {
      products: refetchProducts,
      services: refetchServices,
      events: refetchEvents,
      jobs: refetchJobOffers,
    };
    const fn = refetchMap[refreshTarget];
    if (typeof fn === 'function') fn();

    const next = new URLSearchParams(params);
    next.delete('refresh');
    const qs = next.toString();
    navigate(qs ? `/profile?${qs}` : '/profile', { replace: true });
  }
}, [location.search]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('🔍 currentUser.id:', currentUser.id);
    
        const [
          { data: userData, error: userError },
          { data: productData, error: productError },
          { data: deletedData, error: deletedError },
          { data: soldItems, error: soldError },
          { data: myPurchases, error: purchaseError },
          { data: serviceData, error: serviceError },
          { data: offersData, error: offersError },
          { data: deletedJobData, error: deletedJobsError },
          { data: eventData, error: eventError },
          { data: deletedEventData, error: deletedEventError }
        ] = await Promise.all([
          supabase
            .from('users')
            .select('first_name, last_name, birth_year, nickname, phone, alt_phone, alt_email, is_candidate')
            .eq('id', currentUser.id)
            .single(),
          supabase
            .from('products')
            .select('*')
            .eq('owner', currentUser.id)
            .not('status', 'eq', 'deleted')
            .order('created_at', { ascending: false }),
          supabase
            .from('products')
            .select('*')
            .eq('owner', currentUser.id)
            .eq('status', 'deleted')
            .order('deleted_at', { ascending: false }),
          // 🔵 Bloque para VENTAS (quién compró tus productos)
          supabase
            .from('purchase_items')
            .select(`
              id,
              quantity,
              total_price,
              product_id,
              products (
              id,
              name,
              mainphoto,
              owner
            ),
              purchases (
                id,
                created_at,
                user_id,
                users!purchases_user_id_fkey (
                first_name,
                last_name,
                phone,
                email
              )
            )
          `),

          // 🟢 Bloque para COMPRAS (a quién le compraste)
          supabase
            .from('purchase_items')
            .select(`
              id,
              quantity,
              total_price,
              product_id,
              products (
                id,
                name,
                mainphoto,
                owner,
                city,
                users!products_owner_fkey (
                first_name,
                last_name,
                phone,
                email
              )
            ),
            purchases (
              id,
              status,
              buyer_confirmed,
              created_at,
              user_id
            )
          `),
          supabase
            .from('services') // Nueva consulta
            .select('*')
            .eq('owner', currentUser.id)
            .not('status', 'eq', 'deleted')
            .order('created_at', { ascending: false }),
          supabase
            .from('yacht_work_offers')
            .select('*')
            .eq('user_id', currentUser.id)
            .not('status', 'eq', 'deleted')
            .order('created_at', { ascending: false }),
          supabase
            .from('yacht_work_offers')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('status', 'deleted')
            .order('updated_at', { ascending: false }),
          supabase
            .from('events')
            .select('*')
            .eq('owner', currentUser.id)
            .not('status', 'eq', 'deleted')
            .order('created_at', { ascending: false }),
          supabase
            .from('events')
            .select('*')
            .eq('owner', currentUser.id)
            .eq('status', 'deleted')
            .order('updated_at', { ascending: false }),              
        ]);

  const { data: reviewsData, error: reviewsError } = await supabase
  .from('user_reviews')
  .select(`
    *,
    purchases (
      id,
      purchase_items (
        product_id,
        products (
          mainphoto,
          name
        )
      )
    )
  `)
  .eq('reviewed_user_id', currentUser.id)
  .order('created_at', { ascending: false });

const { data: myReviewsData, error: myReviewsError } = await supabase
  .from('user_reviews')
  .select('*')
  .eq('reviewer_id', currentUser.id);

if (myReviewsError) {
  console.error('Failed to load submitted ratings:', myReviewsError.message);
} else {
  setSentReviews(myReviewsData || []);
}

if (reviewsError) {
  console.error('Failed to load received ratings:', reviewsError.message);
}
setReceivedReviews(reviewsData || []);

const totalRatings = (reviewsData || []).reduce((sum, r) => sum + r.rating, 0);
const avgRating = reviewsData && reviewsData.length > 0
  ? (totalRatings / reviewsData.length).toFixed(1)
  : null;

setAverageRating(avgRating);
    
        if (deletedJobsError) throw deletedJobsError;
        setDeletedJobs(deletedJobData || []);

        if (offersError) throw offersError;
        setJobOffers(offersData || []);

        if (userError) throw userError;
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
    
        if (eventError) {
  console.error('Failed to load events:', eventError.message);
  setEvents([]);
} else {
  setEvents(eventData || []);
}

        if (deletedEventError) {
  console.error('Failed to load deleted events:', deletedEventError.message);
  setDeletedEvents([]);
} else {
  setDeletedEvents(deletedEventData || []);
}

        const filteredSales = (soldItems || []).filter(
  item => String(item.products?.owner) === String(currentUser?.id)
);
        const filteredPurchases = (myPurchases || []).filter(item => item.purchases?.user_id === currentUser.id);
    
        console.log('💰 My Sales:', soldItems);
        console.log('🧪 My Sales - Owner IDs:', soldItems?.map(i => i.products?.owner));
        console.log('🧪 My Filtered Sales:', filteredSales);
        console.log("🧾 Ventas filtradas:", filteredSales);
        console.log('🧪 SOLD RAW:', JSON.stringify(soldItems, null, 2));
    
        console.log('🛒 My Purchases:', myPurchases);
        console.log('🧪 My Purchases - Buyer IDs:', myPurchases?.map(i => i.purchases?.user_id));
        console.log('🧪 My Filtered Purchases:', filteredPurchases);
        console.log('🧪 PURCHASE RAW:', JSON.stringify(myPurchases, null, 2));
    
        console.log('🗑️ Deleted Products:', deletedData);
    
        setProducts(productData || []);
        setDeletedProducts(deletedData || []);
        setSales(filteredSales);
        setPurchases(filteredPurchases);
        setServices(serviceData || []);
        setReceivedReviews(reviewsData || []);
      } catch (error) {
        console.error('General error loading data:', error.message);
      } finally {
        setLoading(false);
      }
    };    

    if (currentUser?.id) fetchUserData();
}, [currentUser]);

useEffect(() => {
  fetchEvents();
}, [currentUser]);


  const handlePauseToggle = async (productId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: currentStatus === 'active' ? 'paused' : 'active' })
        .eq('id', productId);

      if (error) throw error;
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: currentStatus === 'active' ? 'paused' : 'active' } : p
        )
      );
    } catch (error) {
      console.error('Failed to update product status:', error.message);
      toast.error('Could not update product status.');
    }
  };

  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product? This action will hide it from all users.');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      const { data: updatedDeleted } = await supabase
        .from('products')
        .select('*')
        .eq('owner', currentUser.id)
        .eq('status', 'deleted')
        .order('deleted_at', { ascending: false });
      setDeletedProducts(updatedDeleted);
      toast.error('Product deleted successfully.');
    } catch (error) {
      console.error('Failed to delete product:', error.message);
      toast.error('Could not delete the product.');
    }
  };

  const handleRestore = async (productId) => {
    const confirmRestore = window.confirm('Do you want to restore this product as paused?');
    if (!confirmRestore) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'paused', deleted_at: null })
        .eq('id', productId);

      if (error) throw error;

      setDeletedProducts((prev) => prev.filter((p) => p.id !== productId));
      const { data: updatedProducts } = await supabase
        .from('products')
        .select('*')
        .eq('owner', currentUser.id)
        .not('status', 'eq', 'deleted')
        .order('created_at', { ascending: false });
      setProducts(updatedProducts);
      toast.error('Product restored successfully.');
    } catch (error) {
      console.error('Failed to restore product:', error.message);
      toast.error('Could not restore the product.');
    }
  };

  const handlePauseToggleService = async (serviceId, currentStatus) => {
  try {
    const { error } = await supabase
      .from('services')
      .update({ status: currentStatus === 'active' ? 'paused' : 'active' })
      .eq('id', serviceId);

    if (error) throw error;

    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, status: currentStatus === 'active' ? 'paused' : 'active' } : s
      )
    );
  } catch (error) {
    console.error('Failed to update service status:', error.message);
    toast.error('Could not update service status.');
  }
};

const handleDeleteService = async (serviceId) => {
  const confirmDelete = window.confirm('Are you sure you want to delete this service? This action will hide it from all users.');
  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from('services')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', serviceId);

    if (error) throw error;

    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    toast.error('Service deleted successfully.');
  } catch (error) {
    console.error('Failed to delete service:', error.message);
    toast.error('Could not delete the service.');
  }
};

  const handlePauseToggleJob = async (offerId, currentStatus) => {
  try {
    const { error } = await supabase
      .from('yacht_work_offers')
      .update({ status: currentStatus === 'active' ? 'paused' : 'active' })
      .eq('id', offerId);

    if (error) throw error;

    setJobOffers((prev) =>
      prev.map((o) =>
        o.id === offerId ? { ...o, status: currentStatus === 'active' ? 'paused' : 'active' } : o
      )
    );
  } catch (error) {
    console.error('Failed to update job status:', error.message);
    toast.error('Could not update the job status.');
  }
};

const handleDeleteJob = async (offerId) => {
  const confirmDelete = window.confirm('Are you sure you want to delete this job offer?');
  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from('yacht_work_offers')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', offerId);

    if (error) throw error;

    setJobOffers((prev) => prev.filter((o) => o.id !== offerId));
    toast.error('Job deleted successfully.');
  } catch (error) {
    console.error('Failed to delete job:', error.message);
    toast.error('Could not delete the job offer.');
  }
};

const updateEventStatus = async (eventId, newStatus) => {
  try {
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', eventId);

    if (error) throw error;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, status: newStatus } : e
      )
    );
  } catch (error) {
    toast.error(`Failed to update status: ${error.message}`);
  }
};

const deleteEvent = async (eventId) => {
  const confirmDelete = window.confirm('Are you sure you want to delete this event?');
  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from('events')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (error) throw error;

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    const { data: updatedDeleted } = await supabase
      .from('events')
      .select('*')
      .eq('owner', currentUser.id)
      .eq('status', 'deleted')
      .order('updated_at', { ascending: false });
    setDeletedEvents(updatedDeleted);
    toast.error('Event deleted successfully.');
  } catch (error) {
    toast.error('Could not delete the event.');
  }
};

// Extrae la ruta interna del bucket desde la URL pública
const extractPathFromPublicUrl = (url) => {
  if (!url) return null;
  const m = url.match(/\/object\/public\/avatars\/(.+)$/);
  return m ? m[1] : null; // ej: `${user.id}/avatar_123.webp`
};

const handleRemoveAvatar = async () => {
  try {
    // 1) Borrar del Storage si conocemos la ruta
    const path = extractPathFromPublicUrl(localAvatarUrl);
    if (path) {
      const { error: delErr } = await supabase.storage.from('avatars').remove([path]);
      if (delErr) console.warn('No se pudo borrar del storage (continuo):', delErr.message);
    }

    // 2) Poner avatar_url = NULL en BD
    const { error: dbErr } = await supabase
      .from('users')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', currentUser.id);

    if (dbErr) {
      toast.error('Could not delete the photo.');
      return;
    }

    // 3) Refrescar UI local
    setLocalAvatarUrl(null);
    toast.success('Photo removed. We will use your nickname inside a circle.');
  } catch (e) {
    console.error(e);
    toast.error('An error occurred while removing the photo.');
  }
};

const handleChangeAvatar = async (e) => {
  try {
    const file = e.target.files?.[0];
    if (!file) return;

    const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!okTypes.includes(file.type)) {
      toast.error('Formato inválido. Usa JPG, PNG o WEBP.');
      e.target.value = '';
      return;
    }
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      toast.error('Imagen muy grande. Máx 5MB.');
      e.target.value = '';
      return;
    }

    // Construir ruta: {auth.uid}/avatar_timestamp.ext
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${currentUser.id}/avatar_${Date.now()}.${ext}`;

    // Subir al bucket
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (upErr) throw upErr;

    // URL pública
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = pub?.publicUrl;
    if (!avatarUrl) throw new Error('No se pudo obtener la URL pública.');

    // Guardar en BD
    const { error: dbErr } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', currentUser.id);
    if (dbErr) throw dbErr;

    // Refrescar UI
    setLocalAvatarUrl(avatarUrl);
    toast.success('Foto actualizada.');
  } catch (err) {
    console.error(err);
    toast.error('No se pudo cambiar la foto.');
  } finally {
    // limpiar input para permitir volver a seleccionar el mismo archivo si se desea
    if (e?.target) e.target.value = '';
  }
};

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserFormSubmit = async (e) => {
  e.preventDefault();
  const confirm = window.confirm('Do you want to update your user information?');
  if (!confirm) return;

  setUpdateMessage('');

  const wantsEmailChange = userForm.email && userForm.email !== currentUser.email;
  const wantsPasswordChange = userForm.password && userForm.password.trim() !== '';

if (wantsPasswordChange) {
  if (userForm.password !== userForm.confirmPassword) {
    const msg = 'Passwords do not match.';
    toast.error(msg);
    setUpdateMessage(msg);
    return;
  }
  const strongPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!strongPwd.test(userForm.password)) {
    const ruleMsg = 'Password must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and one special character.';
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
          toast.info('Password must be different from the current one. We will keep your current password.');
        } else {
          throw authError;
        }
      } else {
        authChanged = true;
      }
    }

    if (wantsContactChange) {
      const fullPhone = userForm.phone && userForm.phoneCode ? `+${userForm.phoneCode}${userForm.phone}` : null;
      const fullAltPhone = userForm.altPhone && userForm.altPhoneCode ? `+${userForm.altPhoneCode}${userForm.altPhone}` : null;

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
      setUpdateMessage('Contact details updated. Password unchanged because it matches your current one.');
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
};

  const handleCandidateToggle = async (e) => {
  const next = e.target.checked;
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_candidate: next, updated_at: new Date().toISOString() })
      .eq('id', currentUser.id);
    if (error) throw error;
    setCandidateEnabled(next);
    // Si se desactiva estando en la pestaña CV, volvemos a User Details
    if (!next && activeTab === 'cv') setActiveTab('usuario');
    toast.success(next ? 'Candidate profile enabled.' : 'Candidate profile disabled.');
  } catch (err) {
    toast.error('Could not update Candidate profile setting.');
  }
};

  const renderTabContent = () => {
    switch (activeTab) {
      case 'productos':
        return (
          <ProfileProductsTab
            products={products}
            onEdit={setEditingProductId}
            onTogglePause={handlePauseToggle}
            onDelete={handleDelete}
          />
        );
      case 'servicios':
        return (
          <ProfileServicesTab
            services={services}
            onEdit={setEditingServiceId}
            onTogglePause={handlePauseToggleService}
            onDelete={handleDeleteService}
            editingServiceId={editingServiceId}
            onCloseEdit={() => setEditingServiceId(null)}
            onUpdate={fetchServices}
          />
        );

      case 'empleos':
        return (
          <ProfileJobsTab
            jobOffers={jobOffers}
            onTogglePause={handlePauseToggleJob}
            onEdit={setEditingJobId}
            onDelete={handleDeleteJob}
          />
        );

      case 'eventos':
        return (
          <ProfileEventsTab
            events={events}
            onEdit={setEditingEventId}
            onCancel={(eventId) => updateEventStatus(eventId, 'cancelled')}
            onPostpone={(eventId) => updateEventStatus(eventId, 'postponed')}
            onDelete={deleteEvent}
            editingEventId={editingEventId}
            onCloseEdit={() => setEditingEventId(null)}
            onUpdate={fetchEvents}
          />
        );

      case 'eliminados':
        return (
          <ProfileDeletedTab
            deletedProducts={deletedProducts}
            deletedJobs={deletedJobs}
            onRestore={handleRestore}
          />
        );

      case 'valoracion':
        return (
          <ProfileRatingsTab
            averageRating={averageRating}
            receivedReviews={receivedReviews}
          />
        );

      case 'ventas':
        return <ProfileSalesTab sales={sales} />;

      case 'compras':
        return (
          <ProfilePurchasesTab
            purchases={purchases}
            updatedPurchaseStatuses={updatedPurchaseStatuses}
            sentReviews={sentReviews}
            onReviewSubmit={handleReviewSubmit}
            onConfirmPurchase={handleConfirmPurchase}
            onReportProblem={handleReportProblem}
            onCancelPurchase={handleCancelPurchase}
          />
        );

      case 'usuario':
        return (
          <ProfileUserTab
            nickname={nickname}
            localAvatarUrl={localAvatarUrl}
            onChangeAvatar={handleChangeAvatar}
            onRemoveAvatar={handleRemoveAvatar}
            candidateEnabled={candidateEnabled}
            onCandidateToggle={handleCandidateToggle}
            onSubmit={handleUserFormSubmit}
            userDetails={userDetails}
            userForm={userForm}
            onChange={handleUserFormChange}
            updateMessage={updateMessage}
          />
        );

      case 'cv':
        return <CandidateProfileTab />;

      default:
        return null;
    }
  };

const handleConfirmPurchase = async (item) => {
  await confirmPurchase(item.purchases.id);
  toast.error('Purchase confirmed.');
  setPurchases(prev =>
    prev.map(p =>
      p.purchases.id === item.purchases.id
        ? { ...p, purchases: { ...p.purchases, status: 'completed', buyer_confirmed: true } }
        : p
    ));
  setUpdatedPurchaseStatuses(prev => ({ ...prev, [item.purchases.id]: 'completed' }));
};

const handleReportProblem = async (item) => {
  await reportProblem(item.purchases.id);
  toast.error('Problem reported.');
  setPurchases(prev =>
    prev.map(p =>
      p.purchases.id === item.purchases.id
        ? { ...p, purchases: { ...p.purchases, status: 'problem_reported' } }
        : p
    ));
  setUpdatedPurchaseStatuses(prev => ({ ...prev, [item.purchases.id]: 'problem_reported' }));
};

const handleCancelPurchase = async (item) => {
  await cancelPurchase(item.purchases.id);
  toast.error('Purchase cancelled.');
  setPurchases(prev =>
    prev.map(p =>
      p.purchases.id === item.purchases.id
        ? { ...p, purchases: { ...p.purchases, status: 'cancelled' } }
        : p
    ));
  setUpdatedPurchaseStatuses(prev => ({ ...prev, [item.purchases.id]: 'cancelled' }));
};
const handleReviewSubmit = async (e, item) => {
  e.preventDefault();
  const form = e.target;
  const rating = parseInt(form.rating.value, 10);
  const comment = form.comment.value;

  const reviewerId = currentUser.id;
  const reviewedUserId = item.products?.owner;

console.log('🧾 Review submit: Purchase ID =', item.purchases?.id);

    const { success } = await submitUserReview({
    reviewerId,
    reviewedUserId,
    rating,
    comment,
    role: 'buyer',
    purchaseId: item.purchases?.id,
    productId: item.product_id,
  });

  if (success) {
  toast.error('Rating submitted successfully.');
  form.reset();
  setPurchases(prev =>
    prev.map(p =>
      p.purchases.id === item.purchases.id
        ? {
            ...p,
            purchases: {
              ...p.purchases,
              buyer_confirmed: true,
              status: 'completed'
            }
          }
        : p
    )
  );
} else {
  toast.error('An error occurred while submitting the rating.');
}
};
const refetchJobOffers = async () => {
  try {
    const { data, error } = await supabase
      .from('yacht_work_offers')
      .select('*')
      .eq('user_id', currentUser.id)
      .not('status', 'eq', 'deleted')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setJobOffers(data || []);
  } catch (error) {
    console.error('Error refreshing job offers:', error.message);
  }
};
const refetchProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('owner', currentUser.id)
      .not('status', 'eq', 'deleted')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setProducts(data || []);
  } catch (error) {
    console.error('Error refreshing products:', error.message);
  }
};
const refetchServices = async () => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('owner', currentUser.id)
      .not('status', 'eq', 'deleted')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setServices(data || []);
  } catch (error) {
    console.error('Error refreshing services:', error.message);
  }
};
const refetchEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('owner', currentUser.id)
      .not('status', 'eq', 'deleted')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setEvents(data || []);
  } catch (error) {
    console.error('Error refreshing events:', error.message);
  }
};
  return (
  <div className="container">
    <h1>My Profile</h1>

<div className="tabs-container" ref={menuRef}>
  <button
    className="navbar-toggle"
    onClick={() => setIsMenuOpen(!isMenuOpen)}
    aria-expanded={isMenuOpen ? 'true' : 'false'}
    aria-controls="profile-tabs-panel"
  >
    Menu
  </button>

  {/* Añadimos clase 'menu-panel' para heredar paleta de dark mode y nuevos estilos móviles */}
  <div
    id="profile-tabs-panel"
    className={`profile-tabs menu-panel ${isMenuOpen ? 'active' : ''}`}
    role="menu"
  >
    <button
      className={`tab-pill ${isTab('productos')}`}
      onClick={() => { setActiveTab('productos'); setIsMenuOpen(false); }}
      role="menuitem"
    >
      My Products
    </button>

    <button
      className={`tab-pill ${isTab('servicios')}`}
      onClick={() => { setActiveTab('servicios'); setIsMenuOpen(false); }}
      role="menuitem"
    >
      My Services
    </button>

    <button
      className={`tab-pill ${isTab('empleos')}`}
      onClick={() => { setActiveTab('empleos'); setIsMenuOpen(false); }}
      role="menuitem"
    >
      My Jobs
    </button>

    <button
      className={`tab-pill ${isTab('eventos')}`}
      onClick={() => { setActiveTab('eventos'); setIsMenuOpen(false); }}
      role="menuitem"
    >
      My Events
    </button>

    <button
      className={`tab-pill ${isTab('compras')}`}
      onClick={() => { setActiveTab('compras'); setIsMenuOpen(false); }}
      role="menuitem"
    >
      My Purchases
    </button>

    <button
      className={`tab-pill ${isTab('ventas')}`}
      onClick={() => { setActiveTab('ventas'); setIsMenuOpen(false); }}
      role="menuitem"
    >
      My Sales
    </button>

    <button
      className={`tab-pill ${isTab('eliminados')}`}
      onClick={() => { setActiveTab('eliminados'); setIsMenuOpen(false); }}
      role="menuitem"
    >
      Deleted
    </button>

    <button
      className={`tab-pill ${isTab('valoracion')}`}
      onClick={() => { setActiveTab('valoracion'); setIsMenuOpen(false); }}
      role="menuitem"
    >
      Rating
    </button>

    {candidateEnabled && (
      <button
        className={`tab-pill ${isTab('cv')}`}
        onClick={() => { setActiveTab('cv'); setIsMenuOpen(false); }}
        role="menuitem"
      >
        Candidate Profile
      </button>
    )}

    <button
      className={`tab-pill ${isTab('usuario')}`}
      onClick={() => {
        navigate('/profile?tab=usuario', { replace: true });
        setActiveTab('usuario');
        setIsMenuOpen(false);
      }}
      role="menuitem"
    >
      User Details
    </button>
  </div>
</div>

    {loading ? <p>Loading data...</p> : renderTabContent()}

  {editingJobId && (
    <EditJobModal
      jobId={editingJobId}
      onClose={() => setEditingJobId(null)}
      onUpdate={refetchJobOffers}
    />
  )}
  {editingProductId && (
  <EditProductModal
    productId={editingProductId}
    onClose={() => setEditingProductId(null)}
    onUpdate={refetchProducts}
  />
)}
  </div>
);
}
export default ProfilePage;