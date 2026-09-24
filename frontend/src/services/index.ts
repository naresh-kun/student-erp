/**
 * Student ERP — Services Abstraction Layer Entry Point
 *
 * Current Phase (Phase 2):
 * - Mock service adapters fulfill client data and authentication requirements using synthetic datasets.
 *
 * Future Phases (Phase 3 & Beyond):
 * - Acts as the dynamic service switcher between mock adapters (services/mock/)
 *   and Django REST API clients (services/api/) driven by VITE_USE_MOCK_DATA.
 */

export * from './authService';
export * from './mockService';
