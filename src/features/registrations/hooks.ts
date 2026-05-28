// React Query hooks for the student registration flow.
import { useQuery } from '@tanstack/react-query';
import {
  getMyResponse,
  getRegistration,
  listStudentRegistrations,
} from '@/lib/api/registrations';
import type { Registration } from '@/types/registration';

export function useStudentRegistrations() {
  return useQuery({
    queryKey: ['student', 'registrations'],
    queryFn: async () => {
      const { data, error } = await listStudentRegistrations();
      if (error) throw error;
      return (data ?? []) as Registration[];
    },
  });
}

export function useRegistration(id: string) {
  return useQuery({
    queryKey: ['registration', id],
    queryFn: async () => {
      const { data, error } = await getRegistration(id);
      if (error) throw error;
      return data as Registration;
    },
    enabled: !!id,
  });
}

export function useMyResponse(id: string) {
  return useQuery({
    queryKey: ['registration', id, 'my-response'],
    queryFn: async () => {
      const { data, error } = await getMyResponse(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
