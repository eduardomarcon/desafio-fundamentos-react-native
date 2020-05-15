import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      await AsyncStorage.clear();
      const itens = await AsyncStorage.getItem('@GoMarketplace:itens');
      if (itens) {
        const itensParsed = JSON.parse(itens);
        setProducts(itensParsed);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const newProducts = [...products, { ...product, quantity: 1 }];
      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:itens',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const oldProd = products.find(p => p.id === id);
      if (!oldProd) return;
      const newQuantity = !oldProd.quantity ? 1 : oldProd.quantity + 1;
      const newProducts = products.map(o => {
        if (o === oldProd) return { ...oldProd, quantity: newQuantity };
        return o;
      });
      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:itens',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const oldProd = products.find(p => p.id === id);
      if (!oldProd) return;
      const newQuantity = oldProd.quantity === 1 ? 0 : oldProd.quantity - 1;
      const newProducts = products.map(o => {
        if (o === oldProd) return { ...oldProd, quantity: newQuantity };
        return o;
      });
      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:itens',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
