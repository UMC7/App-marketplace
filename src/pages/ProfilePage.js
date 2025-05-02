import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    // Obtener los detalles del usuario desde la tabla users
    const fetchUserDetails = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error al obtener el nickname del usuario:', error.message);
      } else {
        setUserDetails(data);
      }

      setLoading(false);
    };

    fetchUserDetails();

    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('owner', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error.message);
      } else {
        setProducts(data);
      }
    };

    fetchProducts();
  }, [currentUser]);

  const handlePauseToggle = async (productId, currentStatus) => {
    const { error } = await supabase
      .from('products')
      .update({ status: currentStatus === 'active' ? 'paused' : 'active' })
      .eq('id', productId);

    if (error) {
      console.error('Error updating status:', error.message);
      alert('No se pudo actualizar el estado del producto.');
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: currentStatus === 'active' ? 'paused' : 'active' } : p
        )
      );
    }
  };

  const handleDelete = async (productId) => {
    const confirm = window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.');
    if (!confirm) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error.message);
      alert('No se pudo eliminar el producto.');
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  if (!currentUser) return <p>Debes iniciar sesión para ver tu perfil.</p>;
  if (loading) return <p>Cargando productos...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Mi Perfil</h1>
      <p><strong>Nickname:</strong> {userDetails.nickname || 'No tienes nickname'}</p> {/* Mostrar el verdadero nickname aquí */}
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
    </div>
  );
}

export default ProfilePage;