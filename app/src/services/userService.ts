import type { ProfileOverrides, UserAddress } from '@/types';
import type { AuthenticatedUser } from '@/services/authService';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/apiClient';

export type UpdateProfileRequest = Partial<Omit<ProfileOverrides, 'updatedAt'>>;

export type CurrentUserResponse = AuthenticatedUser & {
  overrides?: ProfileOverrides;
};

export const fetchCurrentUser = () => apiGet<CurrentUserResponse>('/users/me');

export const updateUserProfile = (run: string, payload: UpdateProfileRequest) =>
  apiPatch<ProfileOverrides>(
    `/users/${encodeURIComponent(run)}/profile`,
    payload
  );

export const resetUserProfile = (run: string) =>
  apiPost<ProfileOverrides>(`/users/${encodeURIComponent(run)}/profile/reset`);

export const fetchUserAddresses = (run: string) =>
  apiGet<UserAddress[]>(`/users/${encodeURIComponent(run)}/addresses`);

export type CreateAddressRequest = {
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  region: string;
  country: string;
  isPrimary?: boolean;
};

export type UpdateAddressRequest = Partial<{
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  country: string;
  isPrimary: boolean;
}>;

export const createUserAddress = (run: string, payload: CreateAddressRequest) =>
  apiPost<UserAddress>(`/users/${encodeURIComponent(run)}/addresses`, payload);

export const updateUserAddress = (
  run: string,
  addressId: string,
  payload: UpdateAddressRequest
) =>
  apiPatch<UserAddress>(
    `/users/${encodeURIComponent(run)}/addresses/${encodeURIComponent(addressId)}`,
    payload
  );

export const deleteUserAddress = (run: string, addressId: string) =>
  apiDelete<void>(
    `/users/${encodeURIComponent(run)}/addresses/${encodeURIComponent(addressId)}`
  );

export const promoteUserAddress = (run: string, addressId: string) =>
  apiPost<UserAddress>(
    `/users/${encodeURIComponent(run)}/addresses/${encodeURIComponent(addressId)}/primary`
  );
