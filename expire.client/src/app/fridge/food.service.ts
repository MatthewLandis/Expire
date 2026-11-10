import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// One row from the FoodItems table.
export interface FoodItem {
  id: number;
  name: string;
  quantity: number;
  expiryDate: string | null; // "2026-11-20", or null if not set
  status: string;            // "Available" for now
  createdAt: string;
  notes: string | null;
  slot: number;              // 0-14 = freezer, 15-49 = fridge
}

// What the Add food form sends to the server.
export interface NewFood {
  name: string;
  quantity: number;
  expiryDate: string | null;
  notes: string | null;
}

// Talks to FoodController on the server (api/food).
@Injectable({ providedIn: 'root' })
export class FoodService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<FoodItem[]>('/api/food');
  }

  add(food: NewFood) {
    return this.http.post<FoodItem>('/api/food', food);
  }

  // Move a food to another slot. If that slot has food, the server swaps them.
  move(id: number, slot: number) {
    return this.http.put<void>(`/api/food/${id}/move`, { slot });
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/food/${id}`);
  }
}
