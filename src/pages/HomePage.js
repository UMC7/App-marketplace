import React, { useEffect, useState, useCallback } from 'react'; // Importa useCallback
import ProductList from '../components/ProductList'; // Importamos el componente ProductList
import supabase from '../supabase'; // Importamos la configuración de Supabase

function HomePage() {
  const [products, setProducts] = useState([]); // Estado para almacenar productos
  const [categories, setCategories] = useState([]); // Estado para almacenar las categorías
  const [filteredProducts, setFilteredProducts] = useState([]); // Productos filtrados por categoría o búsqueda
  const [loading, setLoading] = useState(true); // Estado para saber si estamos cargando
  const [searchTerm, setSearchTerm] = useState(''); // Estado para almacenar el texto de búsqueda
  const [selectedCategory, setSelectedCategory] = useState(''); // Estado para almacenar la categoría seleccionada

  // Función para obtener productos de la base de datos
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*'); // Obtiene todos los productos
      if (error) throw error;
      setProducts(data); // Guardamos los productos en el estado
      setFilteredProducts(data); // Inicializamos los productos filtrados
      setLoading(false); // Finaliza la carga
    } catch (error) {
      console.error('Error al cargar los productos:', error.message);
      setLoading(false); // En caso de error también terminamos el loading
    }
  };

  // Función para obtener categorías de la base de datos
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*'); // Obtiene todas las categorías
      if (error) throw error;
      setCategories(data); // Guardamos las categorías en el estado
    } catch (error) {
      console.error('Error al cargar las categorías:', error.message);
    }
  };

  // Función para filtrar productos basados en la búsqueda y la categoría seleccionada
  const filterProducts = useCallback(() => { // Usamos useCallback para memoizar la función
    let filtered = products;

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category_id === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered); // Actualizamos los productos filtrados
  }, [products, selectedCategory, searchTerm]); // Dependencias para que se actualice cuando cambien estos valores

  // Llamadas a las funciones de obtener productos y categorías al cargar el componente
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []); // Solo se ejecuta una vez al montar el componente

  // Llamar a la función de filtrar cada vez que cambie la búsqueda o la categoría
  useEffect(() => {
    filterProducts(); // Llamamos a filterProducts para filtrar los productos
  }, [filterProducts]); // Añadimos filterProducts como dependencia

  // Renderizamos la interfaz de usuario
  return (
    <div>
      <h1>Bienvenido al Marketplace</h1>

      {/* Filtro de categoría */}
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">Filtrar por categoría</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      {/* Barra de búsqueda */}
      <input
        type="text"
        placeholder="Buscar productos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <p>Cargando productos...</p> // Mensaje de carga
      ) : (
        <ProductList products={filteredProducts} /> // Pasamos los productos filtrados al componente ProductList
      )}
    </div>
  );
}

export default HomePage;