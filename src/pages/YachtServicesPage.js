// src/pages/YachtServicesPage.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './YachtServicesPage.css';
import ScrollToTopButton from '../components/ScrollToTopButton';
import LoadingSpinner from '../components/LoadingSpinner';
import supabase from '../supabase';

// Carrusel (mismo paquete que ya usas en ProductDetailPage)
import Slider from 'react-slick';
import { isInNativeApp, postShareToNative } from '../utils/nativeShare';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function YachtServicesPage() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const cardRefs = useRef({});
  const collapseTargetRef = useRef(null);

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

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('service');
    if (targetId) {
      setExpandedServiceId(targetId);
    }
  }, [loading]);

  const getScrollOffset = () => {
    const nav = document.querySelector('.navbar-container');
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    return navHeight + 8;
  };

  useEffect(() => {
    if (!expandedServiceId) return;
    const el = cardRefs.current[expandedServiceId];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top, behavior: 'smooth' });
  }, [expandedServiceId]);

  useEffect(() => {
    if (expandedServiceId) return;
    const id = collapseTargetRef.current;
    if (!id) return;
    collapseTargetRef.current = null;
    const el = cardRefs.current[id] || document.getElementById(`service-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top, behavior: 'smooth' });
  }, [expandedServiceId]);

  const updateUrlParam = (serviceIdOrNull) => {
    const url = new URL(window.location.href);
    if (serviceIdOrNull) {
      url.searchParams.set('service', serviceIdOrNull);
    } else {
      url.searchParams.delete('service');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const toggleExpand = (serviceId) => {
    setExpandedServiceId((prevId) => {
      if (prevId === serviceId) {
        collapseTargetRef.current = serviceId;
        updateUrlParam(null);
        return null;
      }
      updateUrlParam(serviceId);
      return serviceId;
    });
  };

  const getShareUrl = (serviceId) =>
    `${window.location.origin}/api/service-og?service=${encodeURIComponent(serviceId)}`;

  const getShareData = (service) => {
    const locationText = [service.city, service.country].filter(Boolean).join(' - ');
    return {
      title: service.company_name || 'SeaServices',
      text: `${service.company_name || 'SeaServices'}${locationText ? ' · ' + locationText : ''}`,
      url: getShareUrl(service.id),
    };
  };

  const handleCopyLink = async (serviceId) => {
    const shareUrl = getShareUrl(serviceId);
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      alert('Link copied!');
    }
  };

  const handleWhatsApp = (service) => {
    const data = getShareData(service);
    const msg = `SeaServices: ${data.text}\n${data.url}`;
    const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(wa, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async (service, e) => {
    e.stopPropagation();
    const data = getShareData(service);
    if (isInNativeApp()) {
      postShareToNative(data);
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (err) {
        if (err && err.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading services..." />;
  }

  // Carrusel: autoplay, sin flechas ni dots
  const sliderSettings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 400,
    autoplay: true,
    autoplaySpeed: 2500,
    slidesToShow: 1,
    slidesToScroll: 1,
    pauseOnHover: true,
    swipe: true,
    adaptiveHeight: true,
  };

  const supportsWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const showNativeShare = supportsWebShare || isInNativeApp();
  const iconBarStyle = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 };
  const roundBtn = {
    width: 44, height: 44, borderRadius: '9999px', border: '1px solid rgba(0,0,0,0.1)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: '#fff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.06)'
  };
  const waBtn = { ...roundBtn, background: '#25D366', border: 'none' };
  const iconImg = { width: 22, height: 22, display: 'block' };
  const shareIcon = { fontSize: 22, color: '#111' };

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
          {filteredServices.map((service) => {
            // Normalizar galería (array o string JSON)
            let gallery = [];
            if (Array.isArray(service.photos)) {
              gallery = service.photos;
            } else if (typeof service.photos === 'string') {
              const s = service.photos.trim();
              if (s.startsWith('[')) {
                try { gallery = JSON.parse(s) || []; } catch { gallery = []; }
              }
            }
            const allImages = [service.mainphoto, ...gallery].filter(Boolean).slice(0, 5);
            const coverOrPlaceholder = allImages[0] || 'https://via.placeholder.com/250';

            return (
              <div
                key={service.id}
                id={`service-${service.id}`}
                className={`yacht-card ${expandedServiceId === service.id ? 'expanded' : ''}`}
                ref={(el) => { if (el) cardRefs.current[service.id] = el; }}
                onClick={() => toggleExpand(service.id)}
              >
                {/* Si está colapsada: solo una imagen (la principal) */}
                {expandedServiceId !== service.id && (
                  <img
                    src={coverOrPlaceholder}
                    alt={service.company_name}
                    style={{ width: '100%', height: '150px', objectFit: 'contain', backgroundColor: '#fff' }}
                  />
                )}

                {/* Si está expandida: el carrusel ocupa el mismo bloque visual */}
                {expandedServiceId === service.id && allImages.length > 0 && (
                  <div
                    style={{ marginBottom: 8 }}
                    onClick={(e) => e.stopPropagation()} // evitar colapsar al tocar el carrusel
                  >
                    <Slider {...sliderSettings}>
                      {allImages.map((url, i) => (
                        <div key={url + i}>
                          <img
                            src={url}
                            alt=""
                            style={{
                              width: '100%',
                              height: 220,
                              objectFit: 'contain',
                              backgroundColor: '#fff',
                              borderRadius: 8,
                            }}
                          />
                        </div>
                      ))}
                    </Slider>
                  </div>
                )}

                <h3>{service.company_name}</h3>
                <p><strong>City:</strong> {service.city}</p>
                <p><strong>Country:</strong> {service.country}</p>
                <p><strong>Category:</strong> {service.categories?.name || 'Uncategorized'}</p>

                {expandedServiceId === service.id && (
                  <div className="service-share-bar" style={iconBarStyle} onClick={(e) => e.stopPropagation()}>
                    {showNativeShare ? (
                      <button
                        type="button"
                        onClick={(e) => handleShare(service, e)}
                        style={roundBtn}
                        className="service-share-btn"
                        aria-label="Share"
                        title="Share"
                      >
                        <span className="material-icons service-share-material" style={shareIcon}>ios_share</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleWhatsApp(service); }}
                          style={waBtn}
                          className="service-share-btn service-share-btn-wa"
                          aria-label="Share on WhatsApp"
                          title="Share on WhatsApp"
                        >
                          <img src="/icons/whatsapp.svg" alt="" style={iconImg} className="service-share-icon" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleCopyLink(service.id); }}
                          style={roundBtn}
                          className="service-share-btn"
                          aria-label="Copy share link"
                          title="Copy link"
                        >
                          <img src="/icons/link.svg" alt="" style={iconImg} className="service-share-icon" />
                        </button>
                      </>
                    )}
                  </div>
                )}

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
            );
          })}
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
}

export default YachtServicesPage;
