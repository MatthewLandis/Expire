import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodItem, FoodService } from './food.service';

// The fridge has 50 slots (5 across x 10 down), numbered 0 to 49.
// The first 15 (top 3 rows) are the freezer. These match FoodController on the server.
const TOTAL_SLOTS = 50;
const FREEZER_SLOTS = 15;

@Component({
  selector: 'app-fridge',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './fridge.html',
  styleUrl: './fridge.css'
})
export class Fridge implements OnInit {
  private foodService = inject(FoodService);

  // The food in the fridge, loaded from the server.
  readonly foods = signal<FoodItem[]>([]);

  // The food whose details are open (null = nothing picked).
  readonly selected = signal<FoodItem | null>(null);

  readonly showForm = signal(false);
  readonly isSaving = signal(false);
  readonly message = signal('');

  // Every slot number, 0 to 49, so the template can loop over them.
  readonly slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);
  readonly freezerSlots = FREEZER_SLOTS;

  // The food being dragged right now (null = not dragging).
  private draggedFood: FoodItem | null = null;

  // The slot the dragged food is hovering over, so it can be highlighted.
  readonly dropSlot = signal<number | null>(null);

  // Add food form fields (only the name is required).
  name = '';
  quantity = 1;
  expiryDate = '';
  notes = '';

  // Runs once when the page opens.
  ngOnInit() {
    this.foodService.getAll().subscribe({
      next: foods => this.foods.set(foods),
      error: () => this.message.set('Could not load your food. Try refreshing the page.')
    });
  }

  // ---------- Freshness ----------
  // Freshness is worked out from the expiry date every time the page shows,
  // so it is never out of date. It is NOT saved in the database.

  // How many days until the food expires. 0 = today, negative = already expired.
  daysLeft(food: FoodItem) {
    // Adding 'T00:00' makes the browser read the date in your own time zone.
    const expiry = new Date(food.expiryDate + 'T00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // midnight, so only whole days count

    const oneDay = 24 * 60 * 60 * 1000; // in milliseconds
    return Math.round((expiry.getTime() - today.getTime()) / oneDay);
  }

  // The CSS class that colors a food's slot.
  freshness(food: FoodItem) {
    if (!food.expiryDate) return 'no-date';

    const days = this.daysLeft(food);
    if (days < 0) return 'expired';
    if (days === 0) return 'use-today';
    if (days <= 3) return 'use-soon';
    return 'fresh';
  }

  // The words shown on the badge, e.g. "Expires in 3 days".
  expiryText(food: FoodItem) {
    if (!food.expiryDate) return 'No expiry date';

    const days = this.daysLeft(food);
    if (days < -1) return `Expired ${-days} days ago`;
    if (days === -1) return 'Expired yesterday';
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  }

  // The food sitting in a slot, or undefined if the slot is empty.
  foodInSlot(slot: number) {
    return this.foods().find(food => food.slot === slot);
  }

  // ---------- Drag and drop ----------
  // This uses the browser's built-in dragging (the "draggable" attribute),
  // so there's no extra library. It works with a mouse, not on phones.

  onDragStart(event: DragEvent, food: FoodItem) {
    this.draggedFood = food;
    // Firefox won't start a drag unless some data is attached, so attach the name.
    event.dataTransfer?.setData('text/plain', food.name);
  }

  // Fires over and over while you drag across a slot.
  onDragOver(event: DragEvent, slot: number) {
    // By default the browser says "you can't drop here".
    // preventDefault() tells it this slot DOES accept drops.
    event.preventDefault();
    this.dropSlot.set(slot);
  }

  // Fires when you let go, even if you let go somewhere that isn't a slot.
  onDragEnd() {
    this.draggedFood = null;
    this.dropSlot.set(null);
  }

  onDrop(slot: number) {
    const food = this.draggedFood;
    this.onDragEnd();

    // Dropped back where it started - nothing to do.
    if (!food || food.slot === slot) return;

    const oldSlot = food.slot;
    const otherFood = this.foodInSlot(slot);

    this.foodService.move(food.id, slot).subscribe({
      next: () => {
        // Same as the server: the dragged food takes the new slot,
        // and any food that was already there takes the old one.
        this.foods.set(this.foods().map(f => {
          if (f.id === food.id) return { ...f, slot: slot };
          if (f.id === otherFood?.id) return { ...f, slot: oldSlot };
          return f;
        }));
      },
      error: () => this.message.set(`Could not move ${food.name}.`)
    });
  }

  // ---------- Details window ----------

  select(food: FoodItem) {
    this.selected.set(food);
  }

  closeDetails() {
    this.selected.set(null);
  }

  // ---------- Add food form ----------

  openForm() {
    this.showForm.set(true);
  }

  // Close the form and reset it for next time.
  closeForm() {
    this.showForm.set(false);
    this.name = '';
    this.quantity = 1;
    this.expiryDate = '';
    this.notes = '';
  }

  onAdd() {
    this.message.set('');
    this.isSaving.set(true);

    this.foodService.add({
      name: this.name,
      quantity: this.quantity,
      // An empty date box gives '' - send null so the server knows "no date".
      expiryDate: this.expiryDate || null,
      notes: this.notes || null
    }).subscribe({
      next: newFood => {
        // Put the new food at the end of the list, no need to reload everything.
        this.foods.set([...this.foods(), newFood]);
        this.isSaving.set(false);
        this.closeForm();
      },
      error: err => {
        // Show the server's message if it sent one (like "Your fridge is full.").
        this.message.set(err.error?.message ?? 'Could not add that food. Check the details and try again.');
        this.isSaving.set(false);
      }
    });
  }

  // ---------- Delete ----------

  onDelete(food: FoodItem) {
    this.foodService.delete(food.id).subscribe({
      next: () => {
        // Keep every food except the one we just deleted, and close its details.
        this.foods.set(this.foods().filter(f => f.id !== food.id));
        this.selected.set(null);
      },
      error: () => this.message.set(`Could not delete ${food.name}.`)
    });
  }
}
