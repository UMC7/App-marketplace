// src/pages/ProfilePage.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';

function ProfilePage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [services, setServices] = useState([]); // ✅ Nuevo estado para servicios
  const [jobOffers, setJobOffers] = useState([]);
  const [deletedJobs, setDeletedJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [deletedEvents, setDeletedEvents] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('productos');

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
  console.error('Error cargando eventos:', eventError.message);
  setEvents([]);
} else {
  setEvents(eventData || []);
}

        if (deletedEventError) {
  console.error('Error cargando eventos eliminados:', deletedEventError.message);
  setDeletedEvents([]);
} else {
  setDeletedEvents(deletedEventData || []);
}

        const filteredSales = (soldItems || []).filter(item => item.products?.owner === currentUser.id);
        const filteredPurchases = (myPurchases || []).filter(item => item.purchases?.user_id === currentUser.id);
    
        console.log('💰 Mis Ventas:', soldItems);
        console.log('🧪 Mis Ventas - Owner IDs:', soldItems?.map(i => i.products?.owner));
        console.log('🧪 Mis Ventas filtradas:', filteredSales);
        console.log('🧪 SOLD RAW:', JSON.stringify(soldItems, null, 2));
    
        console.log('🛒 Mis Compras:', myPurchases);
        console.log('🧪 Mis Compras - Buyer IDs:', myPurchases?.map(i => i.purchases?.user_id));
        console.log('🧪 Mis Compras filtradas:', filteredPurchases);
        console.log('🧪 PURCHASE RAW:', JSON.stringify(myPurchases, null, 2));
    
        console.log('🗑️ Productos Eliminados:', deletedData);
    
        setProducts(productData || []);
        setDeletedProducts(deletedData || []);
        setSales(filteredSales);
        setPurchases(filteredPurchases);
        setServices(serviceData || []);
      } catch (error) {
        console.error('Error general al cargar datos:', error.message);
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
      console.error('Error actualizando estado del producto:', error.message);
      alert('No se pudo actualizar el estado del producto.');
    }
  };

  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción lo ocultará de todos los usuarios.');
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
      alert('Producto eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar producto:', error.message);
      alert('No se pudo eliminar el producto.');
    }
  };

  const handleRestore = async (productId) => {
    const confirmRestore = window.confirm('¿Deseas restaurar este producto como pausado?');
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
      alert('Producto restaurado correctamente.');
    } catch (error) {
      console.error('Error al restaurar producto:', error.message);
      alert('No se pudo restaurar el producto.');
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
    console.error('Error actualizando estado del servicio:', error.message);
    alert('No se pudo actualizar el estado del servicio.');
  }
};

const handleDeleteService = async (serviceId) => {
  const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este servicio? Esta acción lo ocultará de todos los usuarios.');
  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from('services')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', serviceId);

    if (error) throw error;

    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    alert('Servicio eliminado correctamente.');
  } catch (error) {
    console.error('Error al eliminar servicio:', error.message);
    alert('No se pudo eliminar el servicio.');
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
    console.error('Error actualizando estado del empleo:', error.message);
    alert('No se pudo actualizar el estado del empleo.');
  }
};

const handleDeleteJob = async (offerId) => {
  const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar esta oferta de empleo?');
  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from('yacht_work_offers')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', offerId);

    if (error) throw error;

    setJobOffers((prev) => prev.filter((o) => o.id !== offerId));
    alert('Empleo eliminado correctamente.');
  } catch (error) {
    console.error('Error al eliminar empleo:', error.message);
    alert('No se pudo eliminar la oferta de empleo.');
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
    alert(`Error al actualizar estado: ${error.message}`);
  }
};

const deleteEvent = async (eventId) => {
  const confirmDelete = window.confirm('¿Seguro que deseas eliminar este evento?');
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
    alert('Evento eliminado correctamente.');
  } catch (error) {
    alert('No se pudo eliminar el evento.');
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
        setAuthError('Contraseña incorrecta. Inténtalo de nuevo.');
      } else {
        setShowPasswordPrompt(false);
      }
    } catch (error) {
      console.error('Error al verificar la contraseña:', error.message);
      setAuthError('Error al verificar la contraseña.');
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    const confirm = window.confirm('¿Deseas actualizar tus datos de usuario?');
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
      setUpdateMessage('Información actualizada correctamente.');
    } catch (error) {
      console.error('Error actualizando datos:', error.message);
      setUpdateMessage('Error al actualizar la información.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'productos':
        return (
          <>
            <h2>Mis Productos Publicados</h2>
            {products.length === 0 ? (
              <p>No has publicado ningún producto.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {products.map((product) => (
                  <div key={product.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', width: '250px' }}>
                    <img src={product.mainphoto || 'https://via.placeholder.com/250'} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
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
      <h2>Mis Servicios Publicados</h2>
      {services.length === 0 ? (
        <p>No has publicado ningún servicio.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {services.map((service) => (
            <div key={service.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', width: '250px' }}>
              <img src={service.mainphoto || 'https://via.placeholder.com/250'} alt={service.company_name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
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
      <h2>Mis Empleos Publicados</h2>
      {jobOffers.length === 0 ? (
        <p>No has publicado ofertas de empleo aún.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {jobOffers.map((offer) => (
            <div key={offer.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', width: '280px' }}>
              <h3>{offer.title}</h3>
              <p><strong>Tipo:</strong> {offer.type}</p>
              <p><strong>Ubicación:</strong> {offer.city}, {offer.country}</p>
              <p><strong>Inicio:</strong> {new Date(offer.start_date).toLocaleDateString()}</p>
              {offer.end_date && <p><strong>Fin:</strong> {new Date(offer.end_date).toLocaleDateString()}</p>}
              {offer.salary && !offer.is_doe && <p><strong>Salario:</strong> ${offer.salary}</p>}
              {offer.is_doe && <p><strong>Salario:</strong> DOE</p>}
              <p><strong>Estado:</strong> {offer.status}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => handlePauseToggleJob(offer.id, offer.status)}>
                  {offer.status === 'paused' ? 'Reactivar' : 'Pausar'}
                </button>
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
      <h2>Mis Eventos Publicados</h2>
      {events.length === 0 ? (
        <p>No has publicado ningún evento.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {events.map((event) => (
            <div key={event.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', width: '250px' }}>
              <img src={event.mainphoto || 'https://via.placeholder.com/250'} alt={event.event_name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
              <h3>{event.event_name}</h3>
              <p><strong>Ciudad:</strong> {event.city}</p>
              <p><strong>País:</strong> {event.country}</p>
              <p><strong>Categoría:</strong> {event.category_id}</p>
              <p><strong>Estado:</strong> {event.status}</p>
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
      <h2>Publicaciones Eliminadas</h2>
      {deletedProducts.length === 0 && deletedJobs.length === 0 ? (
        <p>No tienes publicaciones eliminadas.</p>
      ) : (
        <>
          {deletedProducts.length > 0 && (
            <>
              <h3>Productos Eliminados</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {deletedProducts.map((product) => (
                  <div key={product.id} style={{ border: '1px dashed red', padding: '10px', borderRadius: '8px', width: '250px' }}>
                    <img src={product.mainphoto || 'https://via.placeholder.com/250'} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    <h4>{product.name}</h4>
                    <p><strong>Precio:</strong> {product.currency || ''} {product.price}</p>
                    <p><strong>Eliminado el:</strong> {new Date(product.deleted_at).toLocaleDateString()}</p>
                    <button onClick={() => handleRestore(product.id)}>Restaurar</button>
                  </div>
                ))}
              </div>
            </>
          )}
          {deletedJobs.length > 0 && (
            <>
              <h3>Empleos Eliminados</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {deletedJobs.map((job) => (
  <div key={job.id} style={{ border: '1px dashed red', padding: '10px', borderRadius: '8px', width: '280px' }}>
    <h4>{job.title}</h4>
    <p><strong>Ubicación:</strong> {job.city}, {job.country}</p>
    <p><strong>Tipo:</strong> {job.type}</p>
    <p><strong>Fecha de inicio:</strong> {new Date(job.start_date).toLocaleDateString()}</p>
    {job.end_date && <p><strong>Fin:</strong> {new Date(job.end_date).toLocaleDateString()}</p>}
    {job.is_doe ? (
      <p><strong>Salario:</strong> DOE</p>
    ) : (
      job.salary && <p><strong>Salario:</strong> ${job.salary}</p>
    )}
    {job.deleted_at && (
      <p><strong>Eliminado el:</strong> {new Date(job.deleted_at).toLocaleDateString()}</p>
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
      case 'ventas':
        return (
          <>
            <h2>Mis Ventas</h2>
            {sales.length === 0 ? (
              <p>No has realizado ventas aún.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {sales.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', width: '280px' }}>
                    <img src={item.products?.mainphoto || 'https://via.placeholder.com/250'} alt={item.products?.name || 'Producto'} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    <p><strong>Producto:</strong> {item.products?.name || 'Nombre no disponible'}</p>
                    <p><strong>Cantidad:</strong> {item.quantity}</p>
                    <p><strong>Total:</strong> ${item.total_price}</p>
                    <p><strong>Comprador:</strong> {item.purchases?.buyer?.first_name} {item.purchases?.buyer?.last_name}</p>
                    <p><strong>Teléfono:</strong> {item.purchases?.buyer?.phone || 'No disponible'}</p>
                    <p><strong>Email:</strong> {item.purchases?.buyer?.email || 'No disponible'}</p>
                    <p><strong>Fecha de Compra:</strong> {new Date(item.purchases?.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
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
            <h2>Mis Compras</h2>
            {purchases.length === 0 ? (
              <p>No has realizado compras aún.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {purchases.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', width: '280px' }}>
                    <img src={item.products?.mainphoto || 'https://via.placeholder.com/250'} alt={item.products?.name || 'Producto'} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    <p><strong>Producto:</strong> {item.products?.name || 'Nombre no disponible'}</p>
                    <p><strong>Cantidad:</strong> {item.quantity}</p>
                    <p><strong>Total:</strong> ${item.total_price}</p>
                    <p><strong>Vendedor:</strong> {item.products?.users?.first_name} {item.products?.users?.last_name}</p>
                    <p><strong>Teléfono:</strong> {item.products?.users?.phone || 'No disponible'}</p>
                    <p><strong>Email:</strong> {item.products?.users?.email || 'No disponible'}</p>
                    <p><strong>Ciudad:</strong> {item.products?.city || 'No disponible'}</p>
                    <p><strong>Fecha de Compra:</strong> {new Date(item.purchases?.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'usuario':
        return (
          <>
            <h2>Datos del Usuario</h2>
            {showPasswordPrompt ? (
              <form onSubmit={handlePasswordVerification}>
                <label>Contraseña:
                  <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />
                </label>
                <button type="submit">Verificar</button>
                {authError && <p style={{ color: 'red' }}>{authError}</p>}
              </form>
            ) : (
              <form onSubmit={handleUserFormSubmit}>
                <div><strong>Nombre:</strong> {userDetails.first_name || ''}</div>
                <div><strong>Apellido:</strong> {userDetails.last_name || ''}</div>
                <div><strong>Fecha de Nacimiento:</strong> {userDetails.birth_year || ''}</div>
                <div><strong>Nickname:</strong> {userDetails.nickname || ''}</div>
                <div>
                  <label><strong>Teléfono Principal:</strong>
                    <input name="phone" value={userForm.phone} onChange={handleUserFormChange} />
                  </label>
                </div>
                <div>
                  <label><strong>Teléfono Alternativo:</strong>
                    <input name="altPhone" value={userForm.altPhone} onChange={handleUserFormChange} />
                  </label>
                </div>
                <div>
                  <label><strong>Correo Principal:</strong>
                    <input name="email" value={userForm.email} onChange={handleUserFormChange} />
                  </label>
                </div>
                <div>
                  <label><strong>Correo Alternativo:</strong>
                    <input name="altEmail" value={userForm.altEmail} onChange={handleUserFormChange} />
                  </label>
                </div>
                <div>
                  <label><strong>Contraseña:</strong>
                    <input type="password" name="password" value={userForm.password} onChange={handleUserFormChange} />
                  </label>
                </div>
                <button type="submit">Actualizar Información</button>
                {updateMessage && <p>{updateMessage}</p>}
              </form>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Mi Perfil</h1>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setActiveTab('productos')}>Mis Productos</button>
        <button onClick={() => setActiveTab('servicios')}>Mis Servicios</button>
        <button onClick={() => setActiveTab('empleos')}>Mis Empleos</button>
        <button onClick={() => setActiveTab('eventos')}>Mis Eventos</button>
        <button onClick={() => setActiveTab('compras')}>Mis Compras</button>
        <button onClick={() => setActiveTab('ventas')}>Mis Ventas</button>
        <button onClick={() => setActiveTab('eliminados')}>Productos Eliminados</button>
        <button onClick={() => setActiveTab('valoracion')}>Valoración</button>
        <button onClick={() => setActiveTab('usuario')}>Datos de Usuario</button>
      </div>
      {loading ? <p>Cargando datos...</p> : renderTabContent()}
    </div>
  );
}

export default ProfilePage;