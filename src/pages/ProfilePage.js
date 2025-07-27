// src/pages/ProfilePage.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import { submitUserReview } from '../lib/reviewUtils';
import EditProductModal from '../components/EditProductModal';
import EditServiceModal from '../components/EditServiceModal';
import EditJobModal from '../components/EditJobModal';
import EditEventModal from '../components/EditEventModal';
import {
  confirmPurchase,
  reportProblem,
  cancelPurchase,
} from '../lib/purchaseStatus';

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
    altPhone: '',
    altEmail: '',
    password: '',
  });
  const [updateMessage, setUpdateMessage] = useState('');

const navigate = useNavigate();
const location = useLocation();

useEffect(() => {
  const params = new URLSearchParams(location.search);
  const refreshTarget = params.get('refresh');

  if (refreshTarget === 'products') {
    refetchProducts?.();
    navigate('/profile', { replace: true });
  } else if (refreshTarget === 'services') {
    refetchServices?.();
    navigate('/profile', { replace: true });
  } else if (refreshTarget === 'events') {
    refetchEvents?.();
    navigate('/profile', { replace: true });
  } else if (refreshTarget === 'jobs') {
    refetchJobOffers?.();
    navigate('/profile', { replace: true });
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
          { data: serviceData, error: serviceError }, // Nueva consulta
          { data: offersData, error: offersError },
          { data: deletedJobData, error: deletedJobsError },
          { data: eventData, error: eventError },
          { data: deletedEventData, error: deletedEventError }
        ] = await Promise.all([
          supabase
            .from('users')
            .select('first_name, last_name, birth_year, nickname, phone, alt_phone, alt_email')
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
            .order('deleted_at', { ascending: false }),              
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
        setUserForm((prev) => ({
          ...prev,
          email: currentUser.email,
          nickname: userData.nickname || '',
          phone: userData.phone || '',
          altPhone: userData.alt_phone || '',
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
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', eventId);

    if (error) throw error;

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    const { data: updatedDeleted } = await supabase
      .from('events')
      .select('*')
      .eq('owner', currentUser.id)
      .eq('status', 'deleted')
      .order('deleted_at', { ascending: false });
    setDeletedEvents(updatedDeleted);
    toast.error('Event deleted successfully.');
  } catch (error) {
    toast.error('Could not delete the event.');
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
    const updates = {};
    if (userForm.email !== currentUser.email) updates.email = userForm.email;
    if (userForm.password) updates.password = userForm.password;

    try {
      const { error: authError } = await supabase.auth.updateUser(updates);
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('users')
        .update({
          phone: userForm.phone,
          alt_phone: userForm.altPhone,
          alt_email: userForm.altEmail,
        })
        .eq('id', currentUser.id);

      if (dbError) throw dbError;
      setUpdateMessage('Information updated successfully.');
    } catch (error) {
      console.error('Failed to update information:', error.message);
      setUpdateMessage('Failed to update information.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'productos':
        return (
          <>
            <h2>My Posted Products</h2>
            {products.length === 0 ? (
              <p>You have not posted any products.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {products.map((product) => (
                  <div key={product.id} className="profile-card">
                    <img src={product.mainphoto || 'https://via.placeholder.com/250'} alt={product.name} />
                    <h3>{product.name}</h3>
                    <p><strong>Price:</strong> {product.currency || ''} {product.price}</p>
                    <p><strong>Status:</strong> {product.status}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <button onClick={() => setEditingProductId(product.id)}>Edit</button>
                      <button onClick={() => handlePauseToggle(product.id, product.status)}>{product.status === 'paused' ? 'Reactivate' : 'Pause'}</button>
                      <button onClick={() => handleDelete(product.id)} style={{ color: 'red' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
  case 'servicios':
  return (
    <>
      <h2>My Posted Services</h2>
      {services.length === 0 ? (
        <p>You have not posted any services.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {services.map((service) => (
            <div key={service.id} className="profile-card">
              <img src={service.mainphoto || 'https://via.placeholder.com/250'} alt={service.company_name} />
              <h3>{service.company_name}</h3>
              <p><strong>City:</strong> {service.city}</p>
              <p><strong>Country:</strong> {service.country}</p>
              <p><strong>Category:</strong> {service.category_id}</p>
              <p><strong>Status:</strong> {service.status}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button onClick={() => setEditingServiceId(service.id)}>Edit</button>
                <button onClick={() => handlePauseToggleService(service.id, service.status)}>
                  {service.status === 'paused' ? 'Reactivate' : 'Pause'}
                </button>
                <button onClick={() => handleDeleteService(service.id)} style={{ color: 'red' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editingServiceId && (
        <EditServiceModal
          serviceId={editingServiceId}
          onClose={() => setEditingServiceId(null)}
          onUpdate={fetchServices}
        />
      )}
    </>
  );
  case 'empleos':
  return (
    <>
      <h2>My Posted Jobs</h2>
      {jobOffers.length === 0 ? (
        <p>You have not posted any job offers yet.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {jobOffers.map((offer) => (
  <div key={offer.id} className="profile-card">
    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
      {offer.title}
    </div>
    {offer.teammate_rank && (
      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
        {offer.teammate_rank}
      </div>
    )}
    <p style={{ margin: '4px 0' }}>
      {offer.city}, {offer.country}
    </p>
    <p style={{ margin: '4px 0', fontWeight: '500', fontSize: '0.95rem', color: '#333' }}>
      <strong>Posted:</strong> {new Date(offer.created_at).toLocaleDateString('en-GB')}
    </p>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', gap: '6px' }}>
      <button onClick={() => handlePauseToggleJob(offer.id, offer.status)}>
        {offer.status === 'paused' ? 'Reactivate' : 'Pause'}
      </button>
      <button onClick={() => setEditingJobId(offer.id)}>Edit</button>
      <button onClick={() => handleDeleteJob(offer.id)} style={{ color: 'red' }}>Delete</button>
    </div>
  </div>
))}
        </div>
      )}
    </>
  );
  case 'eventos':
  return (
    <>
      <h2>My Posted Events</h2>
      {events.length === 0 ? (
        <p>You have not posted any events.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {events.map((event) => (
            <div key={event.id} className="profile-card">
              <img src={event.mainphoto || 'https://via.placeholder.com/250'} alt={event.event_name} />
              <h3>{event.event_name}</h3>
              <p><strong>City:</strong> {event.city}</p>
              <p><strong>Country:</strong> {event.country}</p>
              <p><strong>Category:</strong> {event.category_id}</p>
              <p><strong>Status:</strong> {event.status}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button onClick={() => setEditingEventId(event.id)}>Edit</button>
                <button onClick={() => updateEventStatus(event.id, 'cancelled')}>Cancel</button>
                <button onClick={() => updateEventStatus(event.id, 'postponed')}>Postpone</button>
                <button onClick={() => deleteEvent(event.id)} style={{ color: 'red' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editingEventId && (
        <EditEventModal
          eventId={editingEventId}
          onClose={() => setEditingEventId(null)}
          onUpdate={fetchEvents}
        />
      )}
    </>
  );
  case 'eliminados':
  return (
    <>
      <h2>Deleted Posts</h2>
      {deletedProducts.length === 0 && deletedJobs.length === 0 ? (
        <p>You have no deleted posts.</p>
      ) : (
        <>
          {deletedProducts.length > 0 && (
            <>
              <h3>Deleted Products</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {deletedProducts.map((product) => (
                  <div key={product.id} className="profile-card" style={{ border: '1px dashed red' }}>
                    <img src={product.mainphoto || 'https://via.placeholder.com/250'} alt={product.name} />
                    <h4>{product.name}</h4>
                    <p><strong>Price:</strong> {product.currency || ''} {product.price}</p>
                    <p><strong>Deleted on:</strong> {new Date(product.deleted_at).toLocaleDateString()}</p>
                    <button onClick={() => handleRestore(product.id)}>Restore</button>
                  </div>
                ))}
              </div>
            </>
          )}
          {deletedJobs.length > 0 && (
            <>
              <h3>Deleted Jobs</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {deletedJobs.map((job) => (
  <div key={job.id} style={{ border: '1px dashed red', padding: '10px', borderRadius: '8px', width: '280px' }}>
    <h4>{job.title}</h4>
    <p><strong>Location:</strong> {job.city}, {job.country}</p>
    <p><strong>Type:</strong> {job.type}</p>
    <p><strong>Start Date:</strong> {new Date(job.start_date).toLocaleDateString()}</p>
    {job.end_date && <p><strong>End Date:</strong> {new Date(job.end_date).toLocaleDateString()}</p>}
    {job.is_doe ? (
      <p><strong>Salary:</strong> DOE</p>
    ) : (
      job.salary && <p><strong>Salary:</strong> ${job.salary}</p>
    )}
    {job.deleted_at && (
      <p><strong>Deleted on:</strong> {new Date(job.deleted_at).toLocaleDateString()}</p>
    )}
  </div>
))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );

  case 'valoracion':
  return (
    <>
      <h2>Received Ratings</h2>

      {averageRating ? (
        <p><strong>⭐ Overall Average:</strong> {averageRating} / 5</p>
      ) : (
        <p>You have not received any ratings yet.</p>
      )}

      {receivedReviews.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Received Comments:</h3>
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
            {receivedReviews.map((review) => {
  const productPhoto = review.purchases?.purchase_items?.[0]?.products?.mainphoto;
  const productName = review.purchases?.purchase_items?.[0]?.products?.name;

  return (
    <li
      key={review.id}
      style={{
        marginBottom: '15px',
        borderBottom: '1px solid #ccc',
        paddingBottom: '10px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '15px',
      }}
    >
      {productPhoto && (
        <img
          src={productPhoto}
          alt={productName || 'Producto'}
          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
        />
      )}
      <div>
        <p><strong>⭐ Rating:</strong> {review.rating} / 5</p>
        {review.comment && (
          <p><strong>📝 Comment:</strong> {review.comment}</p>
        )}
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          Date: {new Date(review.created_at).toLocaleDateString()}
        </p>
      </div>
    </li>
  );
})}
          </ul>
        </div>
      )}
    </>
  );

      case 'ventas':
        return (
          <>
            <h2>My Sales</h2>
            {sales.length === 0 ? (
              <p>You have not made any sales yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {sales.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', width: '280px' }}>
                    <img src={item.products?.mainphoto || 'https://via.placeholder.com/250'} alt={item.products?.name || 'Product'} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    <p><strong>Product:</strong> {item.products?.name || 'Name not available'}</p>
                    <p><strong>Quantity:</strong> {item.quantity}</p>
                    <p><strong>Total:</strong> ${item.total_price}</p>
                    <p><strong>Buyer:</strong> {item.purchases?.users?.first_name} {item.purchases?.users?.last_name}</p>
                    <p><strong>Phone:</strong> {item.purchases?.users?.phone || 'Not available'}</p>
                    <p><strong>Email:</strong> {item.purchases?.users?.email || 'Not available'}</p>
                    <p><strong>Sale Date:</strong> {new Date(item.purchases?.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'compras':
        return (
          <>
            <h2>My Purchases</h2>
            {purchases.length === 0 ? (
              <p>You have not made any purchases yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {purchases.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', width: '280px' }}>
                    <img src={item.products?.mainphoto || 'https://via.placeholder.com/250'} alt={item.products?.name || 'Product'} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    <p><strong>Product:</strong> {item.products?.name || 'Name not available'}</p>
                    <p><strong>Quantity:</strong> {item.quantity}</p>
                    <p><strong>Total:</strong> ${item.total_price}</p>
                    <p><strong>Seller:</strong> {item.products?.users?.first_name} {item.products?.users?.last_name}</p>
                    <p><strong>Phone:</strong> {item.products?.users?.phone || 'Not available'}</p>
                    <p><strong>Email:</strong> {item.products?.users?.email || 'Not available'}</p>
                    <p><strong>City:</strong> {item.products?.city || 'Not available'}</p>
                    <p><strong>Purchase Date:</strong> {new Date(item.purchases?.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</p>
                    {/* Mostrar el estado de la acción tomada */}
{['completed', 'cancelled', 'problem_reported'].includes(
  updatedPurchaseStatuses[item.purchases?.id] || item.purchases?.status
) && (() => {
  const status = updatedPurchaseStatuses[item.purchases?.id] || item.purchases.status;
  const color =
    status === 'completed'
      ? 'green'
      : status === 'cancelled'
      ? 'orange'
      : 'red';
  const label =
    status === 'completed'
      ? 'Purchase confirmed'
      : status === 'cancelled'
      ? 'Purchase cancelled'
      : 'Problem reported';

  return (
    <div style={{ marginTop: '10px', color }}>
      <strong>✅ Action recorded:</strong> {label}
    </div>
  );
})()}

{/* Mostrar formulario de valoración solo si no se ha hecho */}
{['completed', 'cancelled', 'problem_reported'].includes(item.purchases?.status) &&
 !sentReviews.some(r => r.purchase_id === item.purchases?.id)
  && (
  <div style={{ marginTop: '10px' }}>
    <form onSubmit={(e) => handleReviewSubmit(e, item)}>
      <p><strong>Leave your rating for the seller:</strong></p>
      <label>
        Score (1–5): 
        <input type="number" name="rating" min="1" max="5" required />
      </label>
      <br />
      <label>
        Comment:
        <textarea name="comment" rows="3" style={{ width: '100%' }} />
      </label>
      <br />
      <button type="submit">Submit Rating</button>
    </form>
  </div>
)}

{/* Mostrar botones de acción solo si no se ha hecho nada aún */}
{!['completed', 'cancelled', 'problem_reported'].includes(
  updatedPurchaseStatuses[item.purchases?.id] || item.purchases?.status
) && (
  <div style={{ marginTop: '10px' }}>
    <p><strong>How did this transaction end?</strong></p>

    <button onClick={async () => {
      await confirmPurchase(item.purchases.id);
      toast.error('Purchase confirmed.');

      setPurchases(prev =>
        prev.map(p =>
          p.purchases.id === item.purchases.id
            ? {
                ...p,
                purchases: {
                  ...p.purchases,
                  status: 'completed',
                  buyer_confirmed: true
                }
              }
            : p
        )
      );

    setUpdatedPurchaseStatuses(prev => ({
  ...prev,
  [item.purchases.id]: 'completed'
}));
    }}>Received successfully</button>

    <button onClick={async () => {
      await reportProblem(item.purchases.id);
      toast.error('Problem reported.');
      setPurchases(prev =>
        prev.map(p =>
          p.purchases.id === item.purchases.id
            ? {
                ...p,
                purchases: {
                  ...p.purchases,
                  status: 'problem_reported'
                }
              }
            : p
        )
      );

    setUpdatedPurchaseStatuses(prev => ({
  ...prev,
  [item.purchases.id]: 'problem_reported'
}));
    }}>There was a problem</button>

    <button onClick={async () => {
      await cancelPurchase(item.purchases.id);
      toast.error('Purchase cancelled.');
      setPurchases(prev =>
        prev.map(p =>
          p.purchases.id === item.purchases.id
            ? {
                ...p,
                purchases: {
                  ...p.purchases,
                  status: 'cancelled'
                }
              }
            : p
        )
      );

    setUpdatedPurchaseStatuses(prev => ({
  ...prev,
  [item.purchases.id]: 'cancelled'
}));
    }}>Cancel purchase</button>
  </div>
)}

                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'usuario':
  return (
    <div className="user-info-form">
      <h2>User Information</h2>
      <form onSubmit={handleUserFormSubmit}>
        <div className="static-info"><strong>Name:</strong> {userDetails.first_name || ''}</div>
        <div className="static-info"><strong>Last Name:</strong> {userDetails.last_name || ''}</div>
        <div className="static-info"><strong>Date of Birth:</strong> {userDetails.birth_year || ''}</div>
        <div className="static-info"><strong>Nickname:</strong> {userDetails.nickname || ''}</div>

        <label htmlFor="phone">Main Phone</label>
        <input id="phone" name="phone" value={userForm.phone} onChange={handleUserFormChange} />

        <label htmlFor="altPhone">Alternative Phone</label>
        <input id="altPhone" name="altPhone" value={userForm.altPhone} onChange={handleUserFormChange} />

        <label htmlFor="email">Main Email</label>
        <input id="email" name="email" value={userForm.email} onChange={handleUserFormChange} />

        <label htmlFor="altEmail">Alternative Email</label>
        <input id="altEmail" name="altEmail" value={userForm.altEmail} onChange={handleUserFormChange} />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" name="password" value={userForm.password} onChange={handleUserFormChange} />

        <button type="submit">Update Information</button>
        {updateMessage && <p style={{ marginTop: '10px', color: '#007700' }}>{updateMessage}</p>}
      </form>
    </div>
  );

      default:
        return null;
    }
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

  <div className="tabs-container">
  <button className="navbar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
    Menu
  </button>
  <div className={`profile-tabs ${isMenuOpen ? 'active' : ''}`}>
    <button onClick={() => { setActiveTab('productos'); setIsMenuOpen(false); }}>My Products</button>
    <button onClick={() => { setActiveTab('servicios'); setIsMenuOpen(false); }}>My Services</button>
    <button onClick={() => { setActiveTab('empleos'); setIsMenuOpen(false); }}>My Jobs</button>
    <button onClick={() => { setActiveTab('eventos'); setIsMenuOpen(false); }}>My Events</button>
    <button onClick={() => { setActiveTab('compras'); setIsMenuOpen(false); }}>My Purchases</button>
    <button onClick={() => { setActiveTab('ventas'); setIsMenuOpen(false); }}>My Sales</button>
    <button onClick={() => { setActiveTab('eliminados'); setIsMenuOpen(false); }}>Deleted</button>
    <button onClick={() => { setActiveTab('valoracion'); setIsMenuOpen(false); }}>Rating</button>
    <button onClick={() => { setActiveTab('usuario'); setIsMenuOpen(false); }}>User Details</button>
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