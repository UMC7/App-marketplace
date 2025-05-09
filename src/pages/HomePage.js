import React, { useEffect, useState, useCallback } from 'react';
import ProductList from '../components/ProductList';
import supabase from '../supabase';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCondition, setSelectedCondition] = useState('');
  const [countriesWithProducts, setCountriesWithProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState('');

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      setProducts(data || []);
      setFilteredProducts(data || []);
      setLoading(false);

      const countries = [...new Set(data.map((product) => product.country))];
      setCountriesWithProducts(countries);
    } catch (error) {
      console.error('Error al cargar los productos:', error.message);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error al cargar las categorías:', error.message);
    }
  };

  const filterProducts = useCallback(() => {
    let filtered = [...products];
  
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => String(product.category_id) === String(selectedCategory)
      );
    }
  
    if (selectedCountry) {
      filtered = filtered.filter((product) => product.country === selectedCountry);
    }
  
    if (selectedCity) {
      filtered = filtered.filter((product) =>
        product.city.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }
  
    if (priceRange.min !== '' || priceRange.max !== '') {
      filtered = filtered.filter((product) => {
        const price = product.price;
        const minPriceValid = priceRange.min === '' || price >= priceRange.min;
        const maxPriceValid = priceRange.max === '' || price <= priceRange.max;
        return minPriceValid && maxPriceValid;
      });
    }
  
    if (selectedCondition) {
      filtered = filtered.filter((product) => product.condition === selectedCondition);
    }
  
    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  
    // 🔽 Lógica de ordenamiento por precio
    if (sortOrder === 'asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
      filtered.sort((a, b) => b.price - a.price);
    }
  
    setFilteredProducts(filtered);
  }, [products, selectedCategory, selectedCountry, selectedCity, priceRange, selectedCondition, searchTerm, sortOrder]);  

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  return (
    <div>
      <h1>Bienvenido al Marketplace</h1>
  
      <div className="filters-container">
        <div className="filter-item">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
  
        <div className="filter-item">
          <select
            className="category-select"
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
        </div>
  
        <div className="filter-item">
          <select
            className="category-select"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            <option value="">Filtrar por país</option>
            {countriesWithProducts.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
  
        <div className="filter-item">
          <input
            type="text"
            className="search-input"
            placeholder="Filtrar por ciudad"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          />
        </div>
  
        <div className="filter-item">
          <input
            type="number"
            className="price-input"
            placeholder="Precio mínimo"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
          />
          <input
            type="number"
            className="price-input"
            placeholder="Precio máximo"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
          />
        </div>
  
        <div className="filter-item">
          <select
            className="category-select"
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
          >
            <option value="">Filtrar por condición</option>
            {['Nuevo', 'Usado', 'Reacondicionado'].map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </div>
  
        {/* ✅ Ordenar por precio - correctamente ubicado aquí */}
        <div className="filter-item">
          <select
            className="category-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="">Ordenar por precio</option>
            <option value="asc">Precio: menor a mayor</option>
            <option value="desc">Precio: mayor a menor</option>
          </select>
        </div>
      </div>
  
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <ProductList products={filteredProducts} />
      )}
    </div>
  );  
}

export default HomePage;