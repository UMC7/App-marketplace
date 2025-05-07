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
          { data: myPurchases, error: purchaseError }
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
                user_id
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
                owner
              ),
              purchases (
                id,
                created_at,
                user_id
              )
            `)
        ]);
    
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
                    <p><strong>Precio:</strong> ${product.price}</p>
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
      case 'eliminados':
        return (
          <>
            <h2>Productos Eliminados</h2>
            {deletedProducts.length === 0 ? (
              <p>No tienes productos eliminados.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {deletedProducts.map((product) => (
                  <div key={product.id} style={{ border: '1px dashed red', padding: '10px', borderRadius: '8px', width: '250px' }}>
                    <img src={product.mainphoto || 'https://via.placeholder.com/250'} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    <h3>{product.name}</h3>
                    <p><strong>Precio:</strong> ${product.price}</p>
                    <p><strong>Eliminado el:</strong> {new Date(product.deleted_at).toLocaleDateString()}</p>
                    <button onClick={() => handleRestore(product.id)}>Restaurar</button>
                  </div>
                ))}
              </div>
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
                    <p><strong>Comprador:</strong> {item.purchases?.users?.first_name} {item.purchases?.users?.last_name}</p>
                    <p><strong>Email:</strong> {item.purchases?.users?.email}</p>
                    <p><strong>Fecha:</strong> {new Date(item.purchases?.created_at).toLocaleString()}</p>
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
                    <p><strong>Vendedor (ID):</strong> {item.products?.owner || 'No disponible'}</p>
                    <p><strong>Fecha:</strong> {new Date(item.purchases?.created_at).toLocaleString()}</p>
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
        <button onClick={() => setActiveTab('eliminados')}>Productos Eliminados</button>
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