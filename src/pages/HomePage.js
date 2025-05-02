// src/pages/HomePage.js

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
  const [priceRange, setPriceRange] = useState({ min: '', max: '' }); // Se inicializa vacío
  const [selectedCondition, setSelectedCondition] = useState('');

  const [countriesWithProducts, setCountriesWithProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
      setLoading(false);

      // Obtener los países con productos publicados
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

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => String(product.category_id) === String(selectedCategory)
      );
    }

    // Filtrar por país
    if (selectedCountry) {
      filtered = filtered.filter((product) => product.country === selectedCountry);
    }

    // Filtrar por ciudad (coincidencia parcial de caracteres)
    if (selectedCity) {
      filtered = filtered.filter((product) =>
        product.city.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Filtrar por precio (aplica solo si el valor no está vacío)
    if (priceRange.min !== '' || priceRange.max !== '') {
      filtered = filtered.filter((product) => {
        const price = product.price;
        const minPriceValid = priceRange.min === '' || price >= priceRange.min;
        const maxPriceValid = priceRange.max === '' || price <= priceRange.max;
        return minPriceValid && maxPriceValid;
      });
    }

    // Filtrar por condición
    if (selectedCondition) {
      filtered = filtered.filter((product) => product.condition === selectedCondition);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, selectedCountry, selectedCity, priceRange, selectedCondition, searchTerm]);

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

      {/* Filtro de país */}
      <select
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

      {/* Filtro de ciudad */}
      <input
        type="text"
        placeholder="Filtrar por ciudad"
        value={selectedCity}
        onChange={(e) => setSelectedCity(e.target.value)}
      />

      {/* Filtro de rango de precio */}
      <div>
        <input
          type="number"
          placeholder="Precio mínimo"
          value={priceRange.min}
          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
        />
        <input
          type="number"
          placeholder="Precio máximo"
          value={priceRange.max}
          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
        />
      </div>

      {/* Filtro de condición */}
      <select
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

      {/* Barra de búsqueda */}
      <input
        type="text"
        placeholder="Buscar productos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Lista de productos */}
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <ProductList products={filteredProducts} />
      )}
    </div>
  );
}

export default HomePage;