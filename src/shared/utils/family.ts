/**
 * Family utility functions.
 *
 * Pure functions for working with family member data.
 */

import type { FamilyMember } from '@/types/family'

/**
 * Determines if a family member is an adult (18+ years old).
 *
 * @param member - The family member to check.
 * @returns True if the member is 18 or older, false if younger or DOB is null.
 */
export function isAdult(member: FamilyMember): boolean {
  if (!member.date_of_birth) {
    return false
  }

  const dob = Temporal.PlainDate.from(member.date_of_birth)
  const today = Temporal.Now.plainDateISO()

  let age = today.year - dob.year
  const monthDiff = today.monthNumber - dob.monthNumber

  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.day < dob.day)) {
    age--
  }

  return age >= 18
}

/**
 * Finds the first adult member in a list.
 *
 * @param members - Array of family members.
 * @returns The first adult member, or null if none found.
 */
export function findFirstAdult(members: FamilyMember[]): FamilyMember | null {
  return members.find(isAdult) ?? null
}
