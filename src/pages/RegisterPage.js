import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import { toast } from 'react-toastify';

function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    birthYear: '',
    nickname: '',
    phone: '',
    altPhone: '',
    altEmail: '',
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      console.log('Iniciando signUp con:', form.email);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (signUpError || !data?.user) {
        console.error('❌ Error en signUp:', signUpError?.message);
        toast.error('Registration failed. Please check your information.');
        return;
      }

      const userId = data.user.id;
      console.log('✅ User successfully registered:', userId);

      const insertData = {
        id: userId,
        first_name: form.firstName,
        last_name: form.lastName,
        birth_year: parseInt(form.birthYear),
        nickname: form.nickname,
        phone: form.phone,
        alt_phone: form.altPhone || null,
        alt_email: form.altEmail || null,
        updated_at: new Date().toISOString(),
      };

      // 👇 actualizamos con UPSERT para evitar errores si el trigger ya creó la fila
      const { error: upsertError, data: upsertResult } = await supabase
        .from('users')
        .upsert(insertData, { onConflict: 'id' });

      console.log('🧪 Resultado de upsert:', upsertResult);

      if (upsertError) {
        console.error('❌ Failed to save user data:', upsertError.message);
        toast.error('Partial registration: user account created, but some data was not saved.');
        return;
      }

      console.log('✅ User information updated successfully.');
      navigate('/profile');
    } catch (err) {
      console.error('❌ Something went wrong:', err.message);
      setError('Something went wrong.');
    }
  };

  const birthYears = Array.from({ length: 80 }, (_, i) => 2025 - i);

  const isFormComplete = () => {
  const {
    firstName,
    lastName,
    birthYear,
    nickname,
    phone,
    email,
    password,
    confirmPassword
  } = form;

  return (
    firstName.trim() &&
    lastName.trim() &&
    birthYear &&
    nickname.trim() &&
    phone.trim() &&
    email.trim() &&
    password &&
    confirmPassword &&
    password === confirmPassword
  );
};

  return (
    <div className="container">
    <div className="login-form">
      <h2>User Registration</h2>

      <input name="firstName" placeholder="Name" onChange={handleChange} required />
      <input name="lastName" placeholder="Last Name" onChange={handleChange} required />

      <select name="birthYear" onChange={handleChange} required>
        <option value="">Year of Birth</option>
        {birthYears.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      <input name="nickname" placeholder="Nickname" onChange={handleChange} required />
      <input name="phone" placeholder="Primary Phone" onChange={handleChange} required />
      <input name="altPhone" placeholder="Alternative Phone (optional)" onChange={handleChange} />
      <input name="email" placeholder="Primary Email" onChange={handleChange} required />
      <input name="altEmail" placeholder="Alternative Email (optional)" onChange={handleChange} />

      <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
      <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />

      <button onClick={handleRegister} disabled={!isFormComplete()}>
  Sign Up
</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  </div>
  );
}

export default RegisterPage;