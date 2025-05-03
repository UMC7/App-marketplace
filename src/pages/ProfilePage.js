import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';

function ProfilePage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('productos'); // pestaña activa

  // Estados para la pestaña "Datos de Usuario"
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
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, birth_year, nickname, phone, alt_phone, alt_email')
          .eq('id', currentUser.id)
          .single();

        if (error) throw error;
        setUserDetails(data);
        setUserForm((prev) => ({
          ...prev,
          email: currentUser.email,
          nickname: data.nickname || '',
          phone: data.phone || '',
          altPhone: data.alt_phone || '',
          altEmail: data.alt_email || '',
        }));

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('owner', currentUser.id)
          .order('created_at', { ascending: false });

        if (productError) throw productError;
        setProducts(productData);

      } catch (error) {
        console.error('Error al cargar los datos:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
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
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.');
    if (!confirmDelete) return;

    try {
      await supabase.from('favorites').delete().eq('product_id', productId);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      console.error('Error eliminando producto:', error.message);
      alert('No se pudo eliminar el producto.');
    }
  };

  const handlePasswordVerification = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
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
          nickname: userForm.nickname,
        })
        .eq('id', currentUser.id);

      if (dbError) throw dbError;
      setUpdateMessage('Información actualizada correctamente.');
    } catch (error) {
      console.error('Error actualizando datos:', error.message);
      setUpdateMessage('Error al actualizar la información.');
    }
  };

  if (!currentUser) return <p>Debes iniciar sesión para ver tu perfil.</p>;

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
                  <div
                    key={product.id}
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      padding: '10px',
                      width: '250px',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={product.mainphoto || 'https://via.placeholder.com/250'}
                      alt={product.name}
                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <h3>{product.name}</h3>
                    <p><strong>Precio:</strong> ${product.price}</p>
                    <p><strong>Estado:</strong> {product.status === 'paused' ? 'Pausado' : 'Activo'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                      <button onClick={() => navigate(`/editproduct/${product.id}`)}>Editar</button>
                      <button onClick={() => handlePauseToggle(product.id, product.status)}>
                        {product.status === 'paused' ? 'Reactivar' : 'Pausar'}
                      </button>
                      <button onClick={() => handleDelete(product.id)} style={{ color: 'red' }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'compras':
        return <p>Mis Compras (en desarrollo)</p>;
      case 'ventas':
        return <p>Mis Ventas (en desarrollo)</p>;
      case 'valoracion':
        return <p>Valoración (en desarrollo)</p>;
      case 'usuario':
        return (
          <>
            <h2>Datos del Usuario</h2>
            {showPasswordPrompt ? (
              <form onSubmit={handlePasswordVerification}>
                <label>
                  Ingresa tu contraseña para continuar:
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                  />
                </label>
                <button type="submit">Verificar</button>
                {authError && <p style={{ color: 'red' }}>{authError}</p>}
              </form>
            ) : (
              <form onSubmit={handleUserFormSubmit}>
                <div>
                  <label><strong>Nombre:</strong> {userDetails.first_name || ''}</label>
                </div>
                <div>
                  <label><strong>Apellido:</strong> {userDetails.last_name || ''}</label>
                </div>
                <div>
                  <label><strong>Fecha de Nacimiento:</strong> {userDetails.birth_year || ''}</label>
                </div>
                <div>
                  <label><strong>Nickname:</strong> {userDetails.nickname || ''}</label>
                </div>
                <div>
                  <label><strong>Teléfono principal:</strong>
                    <input
                      type="text"
                      name="phone"
                      value={userForm.phone}
                      onChange={handleUserFormChange}
                    />
                  </label>
                </div>
                <div>
                  <label><strong>Teléfono alternativo:</strong>
                    <input
                      type="text"
                      name="altPhone"
                      value={userForm.altPhone}
                      onChange={handleUserFormChange}
                    />
                  </label>
                </div>
                <div>
                  <label><strong>Correo principal:</strong>
                    <input
                      type="email"
                      name="email"
                      value={userForm.email}
                      onChange={handleUserFormChange}
                    />
                  </label>
                </div>
                <div>
                  <label><strong>Correo alternativo:</strong>
                    <input
                      type="text"
                      name="altEmail"
                      value={userForm.altEmail}
                      onChange={handleUserFormChange}
                    />
                  </label>
                </div>
                <div>
                  <label><strong>Nueva contraseña:</strong>
                    <input
                      type="password"
                      name="password"
                      value={userForm.password}
                      onChange={handleUserFormChange}
                    />
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
        <button onClick={() => setActiveTab('compras')}>Mis Compras</button>
        <button onClick={() => setActiveTab('ventas')}>Mis Ventas</button>
        <button onClick={() => setActiveTab('valoracion')}>Valoración</button>
        <button onClick={() => setActiveTab('usuario')}>Datos de Usuario</button>
      </div>

      {loading ? <p>Cargando datos...</p> : renderTabContent()}
    </div>
  );
}

export default ProfilePage;