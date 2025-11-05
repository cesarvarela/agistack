/**
 * Reusable URL state management hook
 *
 * A wrapper around nuqs that provides a consistent API for persisting UI state in URL query parameters.
 * This makes state survive page refreshes and allows sharing links with specific UI states.
 *
 * @example
 * // String state (like tab selection)
 * const [activeTab, setActiveTab] = useUrlState('tab', 'overview')
 *
 * // Can be extended for other types:
 * // - useUrlNumberState for numeric values
 * // - useUrlBooleanState for toggles
 * // - useUrlArrayState for multi-select filters
 */

import { useQueryState } from "nuqs"

/**
 * Persists a string value in the URL query parameters
 *
 * @param key - The query parameter key (e.g., 'tab', 'filter', 'sort')
 * @param defaultValue - Default value when not present in URL
 * @returns Tuple of [value, setValue] similar to useState
 */
export function useUrlState(key: string, defaultValue: string) {
	return useQueryState(key, { defaultValue })
}

/**
 * Future extensions can be added here as needed:
 *
 * export function useUrlNumberState(key: string, defaultValue: number) {
 *   return useQueryState(key, parseAsInteger.withDefault(defaultValue))
 * }
 *
 * export function useUrlBooleanState(key: string, defaultValue: boolean) {
 *   return useQueryState(key, parseAsBoolean.withDefault(defaultValue))
 * }
 *
 * export function useUrlArrayState(key: string, defaultValue: string[]) {
 *   return useQueryState(key, parseAsArrayOf(parseAsString).withDefault(defaultValue))
 * }
 */
