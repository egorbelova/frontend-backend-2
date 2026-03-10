import { api, type Product, type UpdateProductDto } from '../api';

export type UpdatePayload = Product | UpdateProductDto;

export async function submitUpdatedProduct(
  payload: UpdatePayload,
) {
  const { id, ...data } = payload as Product;
  return api.updateProduct(id, data);
}


