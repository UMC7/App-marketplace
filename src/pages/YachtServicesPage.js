// src/pages/YachtServicesPage.js

import React, { useState, useEffect, useCallback } from 'react';
import './YachtServicesPage.css';
import supabase from '../supabase';

function YachtServicesPage() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [countriesWithServices, setCountriesWithServices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: serviceData, error: serviceError }, { data: categoryData, error: categoryError }] = await Promise.all([
          supabase
            .from('services')
            .select('*, categories(name)')
            .eq('status', 'active')
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('id, name')
            .eq('module', 'service')
            .order('name', { ascending: true }),
        ]);

        if (serviceError) throw serviceError;
        if (categoryError) throw categoryError;

        setServices(serviceData || []);
        setFilteredServices(serviceData || []);
        setCategories(categoryData || []);

        const countries = [...new Set((serviceData || []).map((s) => s.country))];
        setCountriesWithServices(countries);
      } catch (error) {
        console.error('Error loading data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterServices = useCallback(() => {
    let filtered = [...services];

    if (selectedCategory) {
      filtered = filtered.filter(service => String(service.category_id) === String(selectedCategory));
    }

    if (selectedCountry) {
      filtered = filtered.filter(service => service.country === selectedCountry);
    }

    if (selectedCity) {
      filtered = filtered.filter(service =>
        service.city?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  }, [services, selectedCategory, selectedCountry, selectedCity, searchTerm]);

  useEffect(() => {
    filterServices();
  }, [filterServices]);

  const toggleExpand = (serviceId) => {
    setExpandedServiceId((prevId) => (prevId === serviceId ? null : serviceId));
  };

  if (loading) {
    return <p style={{ padding: '20px' }}>Loading services...</p>;
  }

  return (
    <div className="container">
      <div className="module-header-wrapper">
      <div className="module-header-row">
        <h1>SeaServices</h1>
        <span>Discover Professional Yacht Services</span>
      </div>
    </div>

      <h3
        className="filter-toggle"
        onClick={() => setShowFilters((prev) => !prev)}
      >
        {showFilters ? 'Hide Filters ▲' : 'Show Filters ▼'}
      </h3>

      <button
        className="navbar-toggle"
        onClick={() => setShowFilters((prev) => !prev)}
        style={{
          marginBottom: '10px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        ☰ Filters
      </button>

      {showFilters && (
        <div className="filter-body expanded">
          <div className="filters-container filters-panel show">

            <input
              type="text"
              className="search-input"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Filter by category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              className="category-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">Filter by country</option>
              {countriesWithServices.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="search-input"
              placeholder="Filter by city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            />
          </div>
        </div>
      )}

      {filteredServices.length === 0 ? (
        <p style={{ padding: '20px' }}>No services match your filters.</p>
      ) : (
        <div className="responsive-grid">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`yacht-card ${expandedServiceId === service.id ? 'expanded' : ''}`}
              onClick={() => toggleExpand(service.id)}
            >
              <img
                src={service.mainphoto || 'https://via.placeholder.com/250'}
                alt={service.company_name}
                style={{ width: '100%', height: '150px', objectFit: 'contain', backgroundColor: '#fff' }}
              />
              <h3>{service.company_name}</h3>
              <p><strong>City:</strong> {service.city}</p>
              <p><strong>Country:</strong> {service.country}</p>
              <p><strong>Category:</strong> {service.categories?.name || 'Uncategorized'}</p>

              {expandedServiceId === service.id && (
                <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                  <p className="description"><strong>Description:</strong> {service.description}</p>
                  <p><strong>Email:</strong> {service.contact_email}</p>
                  <p><strong>Phone:</strong> {service.contact_phone}</p>
                  <p><strong>Alternative Phone:</strong> {service.alt_phone}</p>
                  {service.website && (
                    <p><strong>Web:</strong> <a href={service.website} target="_blank" rel="noopener noreferrer">{service.website}</a></p>
                  )}
                  {service.facebook_url && (
                    <p><strong>Facebook:</strong> <a href={service.facebook_url} target="_blank" rel="noopener noreferrer">{service.facebook_url}</a></p>
                  )}
                  {service.instagram_url && (
                    <p><strong>Instagram:</strong> <a href={service.instagram_url} target="_blank" rel="noopener noreferrer">{service.instagram_url}</a></p>
                  )}
                  {service.linkedin_url && (
                    <p><strong>LinkedIn:</strong> <a href={service.linkedin_url} target="_blank" rel="noopener noreferrer">{service.linkedin_url}</a></p>
                  )}
                  {service.whatsapp_number && (
                    <p><strong>WhatsApp:</strong> <a href={`https://wa.me/${service.whatsapp_number}`} target="_blank" rel="noopener noreferrer">{service.whatsapp_number}</a></p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default YachtServicesPage;