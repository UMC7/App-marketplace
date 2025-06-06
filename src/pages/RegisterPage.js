// src/pages/RegisterPage.js

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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (signUpError || !data?.user) {
        toast.error('Registration failed. Please check your information.');
        return;
      }

      const userId = data.user.id;

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

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(insertData, { onConflict: 'id' });

      if (upsertError) {
        toast.error('Partial registration: user account created, but some data was not saved.');
        return;
      }

      navigate('/');
    } catch (err) {
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
      confirmPassword,
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

      <label>
        Name <span style={{ color: 'red' }}>*</span>
      </label>
      <input name="firstName" placeholder="Name" onChange={handleChange} required />

      <label>
        Last Name <span style={{ color: 'red' }}>*</span>
      </label>
      <input name="lastName" placeholder="Last Name" onChange={handleChange} required />

      <label>
        Year of Birth <span style={{ color: 'red' }}>*</span>
      </label>
      <select name="birthYear" onChange={handleChange} required>
        <option value="">Year of Birth</option>
        {birthYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <label>
        Nickname <span style={{ color: 'red' }}>*</span>
      </label>
      <input name="nickname" placeholder="Nickname" onChange={handleChange} required />

      <label>
        Primary Phone <span style={{ color: 'red' }}>*</span>
      </label>
      <input name="phone" placeholder="Primary Phone" onChange={handleChange} required />

      <label>Alternative Phone (optional)</label>
      <input name="altPhone" placeholder="Alternative Phone" onChange={handleChange} />

      <label>
        Primary Email <span style={{ color: 'red' }}>*</span>
      </label>
      <input name="email" placeholder="Primary Email" onChange={handleChange} required />

      <label>Alternative Email (optional)</label>
      <input name="altEmail" placeholder="Alternative Email" onChange={handleChange} />

      <label>
        Password <span style={{ color: 'red' }}>*</span>
      </label>
      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        required
      />

      <label>
        Confirm Password <span style={{ color: 'red' }}>*</span>
      </label>
      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm Password"
        onChange={handleChange}
        required
      />

      <button onClick={handleRegister} disabled={!isFormComplete()}>
        Sign Up
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
        <span style={{ color: 'red' }}>*</span> Required fields
      </p>
    </div>
  </div>
);
}

export default RegisterPage;