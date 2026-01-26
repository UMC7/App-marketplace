// src/pages/ProfilePage.js

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import supabase from '../supabase';
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
import useProfileProducts from '../hooks/profile/useProfileProducts';
import useProfileServices from '../hooks/profile/useProfileServices';
import useProfileJobs from '../hooks/profile/useProfileJobs';
import useProfileEvents from '../hooks/profile/useProfileEvents';
import useProfilePurchasesSales from '../hooks/profile/useProfilePurchasesSales';
import useProfileUser from '../hooks/profile/useProfileUser';
import useProfileReviews from '../hooks/profile/useProfileReviews';
import './ProfilePage.css';

const ALLOWED_TABS = new Set([
  'productos','servicios','empleos','eventos',
  'compras','ventas','eliminados','valoracion','usuario','cv'
]);

function ProfilePage() {
  const { currentUser } = useAuth();
  const {
    products,
    deletedProducts,
    setProductsData,
    handlePauseToggle,
    handleDelete,
    handleRestore,
    refetchProducts,
  } = useProfileProducts({ currentUser });
  const {
    sales,
    purchases,
    updatedPurchaseStatuses,
    sentReviews,
    setPurchasesSalesData,
    setSentReviewsData,
    handleConfirmPurchase,
    handleReportProblem,
    handleCancelPurchase,
    handleReviewSubmit,
  } = useProfilePurchasesSales({ currentUser });
  const {
    services,
    setServicesData,
    fetchServices,
    handlePauseToggleService,
    handleDeleteService,
    refetchServices,
  } = useProfileServices({ currentUser });
  const {
    jobOffers,
    deletedJobs,
    setJobsData,
    handlePauseToggleJob,
    handleDeleteJob,
    refetchJobOffers,
  } = useProfileJobs({ currentUser });
  const {
    events,
    setEventsData,
    fetchEvents,
    updateEventStatus,
    deleteEvent,
    refetchEvents,
  } = useProfileEvents({ currentUser });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('productos');
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
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
  } = useProfileUser({ currentUser, activeTab, setActiveTab });
  const { receivedReviews, averageRating, setReviewsData } = useProfileReviews();
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
  setSentReviewsData(myReviewsData);
}

if (reviewsError) {
  console.error('Failed to load received ratings:', reviewsError.message);
}
setReviewsData(reviewsData);

    
        if (deletedJobsError) throw deletedJobsError;
        if (offersError) throw offersError;
        setJobsData(offersData, deletedJobData);

        if (userError) throw userError;
        setUserData(userData);

    
        if (eventError) {
  console.error('Failed to load events:', eventError.message);
}

        if (deletedEventError) {
  console.error('Failed to load deleted events:', deletedEventError.message);
}
        setEventsData(eventData, deletedEventData);

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
    
        setProductsData(productData, deletedData);
        setPurchasesSalesData(filteredSales, filteredPurchases);
        setServicesData(serviceData);
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
