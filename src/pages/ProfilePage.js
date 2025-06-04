// src/pages/ProfilePage.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import { submitUserReview } from '../lib/reviewUtils';
import EditJobModal from '../components/EditJobModal';
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
  const [deletedEvents, setDeletedEvents] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('productos');
  const [editingJobId, setEditingJobId] = useState(null);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [sentReviews, setSentReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 🔧 Para menú hamburguesa


  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
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
                buyer:users (
                  first_name,
                  last_name,
                  phone,
                  email
                )
              )
            `),
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

        const filteredSales = (soldItems || []).filter(item => item.products?.owner === currentUser.id);
        const filteredPurchases = (myPurchases || []).filter(item => item.purchases?.user_id === currentUser.id);
    
        console.log('💰 My Sales:', soldItems);
        console.log('🧪 My Sales - Owner IDs:', soldItems?.map(i => i.products?.owner));
        console.log('🧪 My Filtered Sales:', filteredSales);
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
      alert('Could not update product status.');
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
      alert('Product deleted successfully.');
    } catch (error) {
      console.error('Failed to delete product:', error.message);
      alert('Could not delete the product.');
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
      alert('Product restored successfully.');
    } catch (error) {
      console.error('Failed to restore product:', error.message);
      alert('Could not restore the product.');
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
    alert('Could not update service status.');
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
    alert('Service deleted successfully.');
  } catch (error) {
    console.error('Failed to delete service:', error.message);
    alert('Could not delete the service.');
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
    alert('Could not update the job status.');
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
    alert('Job deleted successfully.');
  } catch (error) {
    console.error('Failed to delete job:', error.message);
    alert('Could not delete the job offer.');
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
    alert(`Failed to update status: ${error.message}`);
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
    alert('Event deleted successfully.');
  } catch (error) {
    alert('Could not delete the event.');
  }
};

  const handlePasswordVerification = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: passwordInput,
      });

      if (error) {
        setAuthError('Incorrect password. Please try again.');
      } else {
        setShowPasswordPrompt(false);
      }
    } catch (error) {
      console.error('Failed to verify password:', error.message);
      setAuthError('Error verifying password.');
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
                    <p><strong>Precio:</strong> {product.currency || ''} {product.price}</p>
                    <p><strong>Estado:</strong> {product.status}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <button onClick={() => navigate(`/editproduct/${product.id}`)}>Editar</button>
                      <button onClick={() => handlePauseToggle(product.id, product.status)}>{product.status === 'paused' ? 'Reactivar' : 'Pausar'}</button>
                      <button onClick={() => handleDelete(product.id)} style={{ color: 'red' }}>Eliminar</button>
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
              <p><strong>Ciudad:</strong> {service.city}</p>
              <p><strong>País:</strong> {service.country}</p>
              <p><strong>Categoría:</strong> {service.category_id}</p>
              <p><strong>Estado:</strong> {service.status}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => navigate(`/editservice/${service.id}`)}>Editar</button>
                <button onClick={() => handlePauseToggleService(service.id, service.status)}>
                {service.status === 'paused' ? 'Reactivar' : 'Pausar'}
                </button>
                <button onClick={() => handleDeleteService(service.id)} style={{ color: 'red' }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
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
        {offer.status === 'paused' ? 'Reactivar' : 'Pausar'}
      </button>
      <button onClick={() => setEditingJobId(offer.id)}>Editar</button>
      <button onClick={() => handleDeleteJob(offer.id)} style={{ color: 'red' }}>Eliminar</button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', gap: '5px' }}>
                <button onClick={() => updateEventStatus(event.id, 'cancelled')}>Cancelar</button>
                <button onClick={() => updateEventStatus(event.id, 'postponed')}>Posponer</button>
                <button onClick={() => deleteEvent(event.id)} style={{ color: 'red' }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
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
                    <p><strong>Buyer:</strong> {item.purchases?.buyer?.first_name} {item.purchases?.buyer?.last_name}</p>
                    <p><strong>Phone:</strong> {item.purchases?.buyer?.phone || 'Not available'}</p>
                    <p><strong>Email:</strong> {item.purchases?.buyer?.email || 'Not available'}</p>
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
      alert('Purchase confirmed.');

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
      alert('Problem reported.');
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
      alert('Purchase cancelled.');
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
          <>
            <h2>User Information</h2>
            {showPasswordPrompt ? (
              <form onSubmit={handlePasswordVerification}>
                <label>Password:
                  <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />
                </label>
                <button type="submit">Verify</button>
                {authError && <p style={{ color: 'red' }}>{authError}</p>}
              </form>
            ) : (
              <form onSubmit={handleUserFormSubmit}>
                <div><strong>Name:</strong> {userDetails.first_name || ''}</div>
                <div><strong>Last Name:</strong> {userDetails.last_name || ''}</div>
                <div><strong>Date of Birth:</strong> {userDetails.birth_year || ''}</div>
                <div><strong>Nickname:</strong> {userDetails.nickname || ''}</div>
                <div>
                  <label><strong>Main Phone:</strong>
                    <input name="phone" value={userForm.phone} onChange={handleUserFormChange} />
                  </label>
                </div>
                <div>
                  <label><strong>Alternative Phone:</strong>
                    <input name="altPhone" value={userForm.altPhone} onChange={handleUserFormChange} />
                  </label>
                </div>
                <div>
                  <label><strong>Main Email:</strong>
                    <input name="email" value={userForm.email} onChange={handleUserFormChange} />
                  </label>
                </div>
                <div>
                  <label><strong>Alternative Email:</strong>
                    <input name="altEmail" value={userForm.altEmail} onChange={handleUserFormChange} />
                  </label>
                </div>
                <div>
                  <label><strong>Password:</strong>
                    <input type="password" name="password" value={userForm.password} onChange={handleUserFormChange} />
                  </label>
                </div>
                <button type="submit">Update Information</button>
                {updateMessage && <p>{updateMessage}</p>}
              </form>
            )}
          </>
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
  alert('Rating submitted successfully.');
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
  alert('An error occurred while submitting the rating.');
}
};
  return (
  <div className="container">
    <h1>My Profile</h1>

    <div className="tabs-container">
  <button className="navbar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
  Menu
</button>
  <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
    <button className="navLink" onClick={() => { setActiveTab('productos'); setIsMenuOpen(false); }}>My Products</button>
    <button className="navLink" onClick={() => { setActiveTab('servicios'); setIsMenuOpen(false); }}>My Services</button>
    <button className="navLink" onClick={() => { setActiveTab('empleos'); setIsMenuOpen(false); }}>My Jobs</button>
    <button className="navLink" onClick={() => { setActiveTab('eventos'); setIsMenuOpen(false); }}>My Events</button>
    <button className="navLink" onClick={() => { setActiveTab('compras'); setIsMenuOpen(false); }}>My Purchases</button>
    <button className="navLink" onClick={() => { setActiveTab('ventas'); setIsMenuOpen(false); }}>My Sales</button>
    <button className="navLink" onClick={() => { setActiveTab('eliminados'); setIsMenuOpen(false); }}>Deleted</button>
    <button className="navLink" onClick={() => { setActiveTab('valoracion'); setIsMenuOpen(false); }}>Rating</button>
    <button className="navLink" onClick={() => { setActiveTab('usuario'); setIsMenuOpen(false); }}>User Details</button>
  </div>
</div>

    {loading ? <p>Loading data...</p> : renderTabContent()}

    {editingJobId && (
  <EditJobModal
    jobId={editingJobId}
    onClose={() => setEditingJobId(null)}
  />
)}
  </div>
);
}
export default ProfilePage;