import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// One row from the FoodItems table.
export interface FoodItem {
  id: number;
  name: string;
  quantity: number;
  expiryDate: string | null; // "2026-11-20", or null if not set
  status: string;            // "Available" while it's in the fridge
  createdAt: string;
  notes: string | null;
  slot: number;              // 0-14 = freezer, 15-44 = fridge
}

// What the Add food and Edit food forms send to the server.
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

  // Save changes from the Edit food form. The server sends back the updated food.
  update(id: number, food: NewFood) {
    return this.http.put<FoodItem>(`/api/food/${id}`, food);
  }

  // Take a food out of the fridge as eaten or thrown out.
  // "Wasted" is what the server stores for thrown out.
  changeStatus(id: number, status: 'Eaten' | 'Wasted') {
    return this.http.put<void>(`/api/food/${id}/status`, { status });
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/food/${id}`);
  }
}
