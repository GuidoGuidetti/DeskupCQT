/**
 * Activity Calculations Utilities
 * Handles time calculations and billing calculations for activities
 */

/**
 * Calculate time difference between start and end times in minutes
 * @param start - Start time in HH:MM or HH:MM:SS format
 * @param end - End time in HH:MM or HH:MM:SS format
 * @returns Total minutes (handles overnight scenarios)
 */
export function calculateTimeDifference(start: string, end: string): number {
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);

  let startTotalMinutes = startHours * 60 + startMinutes;
  let endTotalMinutes = endHours * 60 + endMinutes;

  // Handle overnight scenario (e.g., 23:00 to 02:00)
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60; // Add 24 hours
  }

  return endTotalMinutes - startTotalMinutes;
}

/**
 * Convert minutes to formatted time string HH:MM
 * @param minutes - Total minutes
 * @returns Formatted time string "HH:MM"
 */
export function minutesToFormatted(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Convert formatted time string to minutes
 * @param time - Time string in HH:MM format
 * @returns Total minutes
 */
export function formattedToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate unit quantity based on carnet unit of measure
 * @param minutes - Total minutes worked
 * @param carn_um - Unit of measure: G (Days), H (Hours), T (Tickets)
 * @returns Calculated quantity with 2 decimal precision
 */
export function calculateUnitQuantity(minutes: number, carn_um: string): number {
  switch (carn_um) {
    case 'G': // Giorni (Days) - 8 hours per day
      return Number((minutes / (8 * 60)).toFixed(2));
    case 'H': // Ore (Hours)
      return Number((minutes / 60).toFixed(2));
    case 'T': // Ticket - always 1
      return 1;
    default:
      return 0;
  }
}

/**
 * Calculate total value (price * quantity)
 * @param price - Unit price
 * @param quantity - Quantity
 * @returns Total value with 2 decimal precision
 */
export function calculateValue(price: number, quantity: number): number {
  return Number((price * quantity).toFixed(2));
}

/**
 * Translate unit of measure code to Italian label
 * @param um - Unit of measure: G, H, or T
 * @returns Translated label
 */
export function translateUnitOfMeasure(um: string): string {
  switch (um) {
    case 'G':
      return 'Giorni';
    case 'H':
      return 'Ore';
    case 'T':
      return 'Ticket';
    default:
      return um;
  }
}

/**
 * Get badge color classes for unit of measure
 * @param um - Unit of measure: G, H, or T
 * @returns Tailwind CSS classes for badge styling
 */
export function getUnitBadgeColor(um: string): string {
  switch (um) {
    case 'G':
      return 'bg-purple-100 text-purple-800';
    case 'H':
      return 'bg-blue-100 text-blue-800';
    case 'T':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Translate ticket status to Italian
 * @param status - Ticket status: open, in_progress, waiting, closed
 * @returns Translated status label
 */
export function translateTicketStatus(status: string): string {
  switch (status) {
    case 'open':
      return 'Aperto';
    case 'in_progress':
      return 'In Lavorazione';
    case 'waiting':
      return 'In Attesa';
    case 'closed':
      return 'Chiuso';
    default:
      return status;
  }
}

/**
 * Get badge color classes for ticket status
 * @param status - Ticket status: open, in_progress, waiting, closed
 * @returns Tailwind CSS classes for badge styling
 */
export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'waiting':
      return 'bg-yellow-100 text-yellow-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Translate carnet type code to Italian label
 * @param type - Carnet type: C (Carnet) or F (Consuntivo)
 * @returns Translated type label
 */
export function translateCarnetType(type: string): string {
  return type === 'C' ? 'Carnet' : 'Consuntivo';
}
