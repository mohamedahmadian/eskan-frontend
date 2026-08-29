import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { NavigationHistoryProvider } from "./lib/navigation-history";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth/AuthProvider";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { useSelectNumberOnFocus } from "./hooks/useSelectNumberOnFocus";
import { languages, type AppLanguage } from "./i18n";
import { CaravanCreatePage } from "./pages/caravans/CaravanCreatePage";
import { CaravanDetailPage } from "./pages/caravans/CaravanDetailPage";
import { CaravanEditPage } from "./pages/caravans/CaravanEditPage";
import { CaravanImportPage } from "./pages/caravans/CaravanImportPage";
import { CaravanPilgrimageHistoryPage } from "./pages/caravans/CaravanPilgrimageHistoryPage";
import { CaravanReportPage } from "./pages/caravans/CaravanReportPage";
import { CaravanYearManagementPage } from "./pages/caravans/CaravanYearManagementPage";
import { CaravansListPage } from "./pages/caravans/CaravansListPage";
import { MyCaravanCreatePage } from "./pages/caravans/MyCaravanCreatePage";
import { MyCaravansListPage } from "./pages/caravans/MyCaravansListPage";
import { GroupCreatePage } from "./pages/groups/GroupCreatePage";
import { GroupDetailPage } from "./pages/groups/GroupDetailPage";
import { GroupEditPage } from "./pages/groups/GroupEditPage";
import { GroupsListPage } from "./pages/groups/GroupsListPage";
import { MyGroupCreatePage } from "./pages/groups/MyGroupCreatePage";
import { MyGroupsListPage } from "./pages/groups/MyGroupsListPage";
import { MyReservationsListPage } from "./pages/reservations/MyReservationsListPage";
import { ReceptionSettingsPage } from "./pages/reservations/ReceptionSettingsPage";
import { ReceptionPage } from "./pages/reception/ReceptionPage";
import { SupportRequestCreatePage } from "./pages/support-requests/SupportRequestCreatePage";
import { SupportRequestDetailPage } from "./pages/support-requests/SupportRequestDetailPage";
import { SupportRequestEditPage } from "./pages/support-requests/SupportRequestEditPage";
import { SupportRequestReportPage } from "./pages/support-requests/SupportRequestReportPage";
import { SupportRequestsListPage } from "./pages/support-requests/SupportRequestsListPage";
import { ReservationAdminDetailPage } from "./pages/reservations/ReservationAdminDetailPage";
import { ReservationCreatePage } from "./pages/reservations/ReservationCreatePage";
import { ReservationsAdminListPage } from "./pages/reservations/ReservationsAdminListPage";
import { ReservationStatsPage } from "./pages/reservations/ReservationStatsPage";
import { ProvincialMonitoringMapPage } from "./pages/provincial-monitoring/ProvincialMonitoringMapPage";
import { ProvincialMonitoringProvincePage } from "./pages/provincial-monitoring/ProvincialMonitoringProvincePage";
import { ProvincialMonitoringCityPage } from "./pages/provincial-monitoring/ProvincialMonitoringCityPage";
import { NationalMonitoringPage } from "./pages/national-monitoring/NationalMonitoringPage";
import { ReservationWizardPage } from "./pages/reservations/ReservationWizardPage";
import { AccountPage } from "./pages/AccountPage";
import { MyLocationHistoryPage } from "./pages/location/LocationHistoryPage";
import { MyLocationPage } from "./pages/location/MyLocationPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { CitiesListPage } from "./pages/geo/CitiesListPage";
import { CityCreatePage } from "./pages/geo/CityCreatePage";
import { CityDetailPage } from "./pages/geo/CityDetailPage";
import { CityEditPage } from "./pages/geo/CityEditPage";
import { EntryBorderCreatePage } from "./pages/entry-borders/EntryBorderCreatePage";
import { EntryBorderDetailPage } from "./pages/entry-borders/EntryBorderDetailPage";
import { EntryBorderEditPage } from "./pages/entry-borders/EntryBorderEditPage";
import { EntryBordersListPage } from "./pages/entry-borders/EntryBordersListPage";
import { CountriesListPage } from "./pages/geo/CountriesListPage";
import { CountryCreatePage } from "./pages/geo/CountryCreatePage";
import { CountryDetailPage } from "./pages/geo/CountryDetailPage";
import { CountryEditPage } from "./pages/geo/CountryEditPage";
import { ProvinceCreatePage } from "./pages/geo/ProvinceCreatePage";
import { ProvinceDetailPage } from "./pages/geo/ProvinceDetailPage";
import { ProvinceEditPage } from "./pages/geo/ProvinceEditPage";
import { ProvincesListPage } from "./pages/geo/ProvincesListPage";
import { FoodSupplierCreatePage } from "./pages/food-suppliers/FoodSupplierCreatePage";
import { FoodSupplierDetailPage } from "./pages/food-suppliers/FoodSupplierDetailPage";
import { FoodSupplierEditPage } from "./pages/food-suppliers/FoodSupplierEditPage";
import { FoodSuppliersListPage } from "./pages/food-suppliers/FoodSuppliersListPage";
import { PlaceCreatePage } from "./pages/places/PlaceCreatePage";
import { PlaceDetailPage } from "./pages/places/PlaceDetailPage";
import { PlaceEditPage } from "./pages/places/PlaceEditPage";
import { PlacesListPage } from "./pages/places/PlacesListPage";
import { PlaceTypeCreatePage } from "./pages/place-types/PlaceTypeCreatePage";
import { PlaceTypeDetailPage } from "./pages/place-types/PlaceTypeDetailPage";
import { PlaceTypeEditPage } from "./pages/place-types/PlaceTypeEditPage";
import { PlaceTypesListPage } from "./pages/place-types/PlaceTypesListPage";
import { GovernmentOrganizationCreatePage } from "./pages/government-organizations/GovernmentOrganizationCreatePage";
import { GovernmentOrganizationDetailPage } from "./pages/government-organizations/GovernmentOrganizationDetailPage";
import { GovernmentOrganizationEditPage } from "./pages/government-organizations/GovernmentOrganizationEditPage";
import { GovernmentOrganizationsListPage } from "./pages/government-organizations/GovernmentOrganizationsListPage";
import { IssueLicensePage } from "./pages/licenses/IssueLicensePage";
import { IssuedLicenseDetailPage } from "./pages/licenses/IssuedLicenseDetailPage";
import { IssuedLicensesPage } from "./pages/licenses/IssuedLicensesPage";
import { BenefactorCreatePage } from "./pages/benefactors/BenefactorCreatePage";
import { BenefactorDetailPage } from "./pages/benefactors/BenefactorDetailPage";
import { BenefactorEditPage } from "./pages/benefactors/BenefactorEditPage";
import { BenefactorsListPage } from "./pages/benefactors/BenefactorsListPage";
import { LoginPage } from "./pages/LoginPage";
import { ImpersonateEndedPage } from "./pages/ImpersonateEndedPage";
import { ImpersonateEntryPage } from "./pages/ImpersonateEntryPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PilgrimCardPage } from "./pages/pilgrims/PilgrimCardPage";
import { PilgrimCreatePage } from "./pages/pilgrims/PilgrimCreatePage";
import { PilgrimDetailPage } from "./pages/pilgrims/PilgrimDetailPage";
import { PilgrimEditPage } from "./pages/pilgrims/PilgrimEditPage";
import { PilgrimLocationHistoryPage, PilgrimLocationPage } from "./pages/pilgrims/PilgrimLocationPage";
import { PilgrimPilgrimageHistoryPage } from "./pages/pilgrims/PilgrimPilgrimageHistoryPage";
import { PilgrimSendSmsPage } from "./pages/pilgrims/PilgrimSendSmsPage";
import { PilgrimSetPasswordPage } from "./pages/pilgrims/PilgrimSetPasswordPage";
import { PilgrimsImportPage } from "./pages/pilgrims/PilgrimsImportPage";
import { PilgrimsListPage } from "./pages/pilgrims/PilgrimsListPage";
import { PilgrimsReportPage } from "./pages/pilgrims/PilgrimsReportPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SmsReportPage } from "./pages/sms/SmsReportPage";
import { SmsSendPage } from "./pages/sms/SmsSendPage";
import { SmsSettingsPage } from "./pages/sms/SmsSettingsPage";
import { UserCreatePage } from "./pages/users/UserCreatePage";
import { UserDetailPage } from "./pages/users/UserDetailPage";
import { UserEditPage } from "./pages/users/UserEditPage";
import { UserLocationHistoryPage, UserLocationPage } from "./pages/users/UserLocationPage";
import { UsersListPage } from "./pages/users/UsersListPage";
import { AccommodationCreatePage } from "./pages/accommodations/AccommodationCreatePage";
import { AccommodationDetailPage } from "./pages/accommodations/AccommodationDetailPage";
import { AccommodationEditPage } from "./pages/accommodations/AccommodationEditPage";
import { AccommodationYearManagementPage } from "./pages/accommodations/AccommodationYearManagementPage";
import { AccommodationReportPage } from "./pages/accommodations/AccommodationReportPage";
import { PlacementsListPage } from "./pages/placements/PlacementsListPage";
import { PlacementDetailPage } from "./pages/placements/PlacementDetailPage";
import { PlacementVacatePage } from "./pages/placements/PlacementVacatePage";
import { AccommodationsListPage } from "./pages/accommodations/AccommodationsListPage";
import { MyAccommodationCreatePage } from "./pages/accommodations/MyAccommodationCreatePage";
import { MyAccommodationsListPage } from "./pages/accommodations/MyAccommodationsListPage";
import { AccommodationManagerCreatePage } from "./pages/accommodation-managers/AccommodationManagerCreatePage";
import { AccommodationManagerDetailPage } from "./pages/accommodation-managers/AccommodationManagerDetailPage";
import { AccommodationManagerEditPage } from "./pages/accommodation-managers/AccommodationManagerEditPage";
import { AccommodationManagerLocationHistoryPage, AccommodationManagerLocationPage } from "./pages/accommodation-managers/AccommodationManagerLocationPage";
import { AccommodationManagersListPage } from "./pages/accommodation-managers/AccommodationManagersListPage";
import { CaravanManagerCreatePage } from "./pages/caravan-managers/CaravanManagerCreatePage";
import { CaravanManagerDetailPage } from "./pages/caravan-managers/CaravanManagerDetailPage";
import { CaravanManagerEditPage } from "./pages/caravan-managers/CaravanManagerEditPage";
import { CaravanManagerLocationHistoryPage, CaravanManagerLocationPage } from "./pages/caravan-managers/CaravanManagerLocationPage";
import { CaravanManagersListPage } from "./pages/caravan-managers/CaravanManagersListPage";
import { HeadquartersInfoCreatePage } from "./pages/headquarters-info/HeadquartersInfoCreatePage";
import { HeadquartersInfoDetailPage } from "./pages/headquarters-info/HeadquartersInfoDetailPage";
import { HeadquartersInfoEditPage } from "./pages/headquarters-info/HeadquartersInfoEditPage";
import { HeadquartersInfoListPage } from "./pages/headquarters-info/HeadquartersInfoListPage";
import { HeadquartersPhoneCreatePage } from "./pages/headquarters-phones/HeadquartersPhoneCreatePage";
import { HeadquartersPhoneDetailPage } from "./pages/headquarters-phones/HeadquartersPhoneDetailPage";
import { HeadquartersPhoneEditPage } from "./pages/headquarters-phones/HeadquartersPhoneEditPage";
import { HeadquartersPhonesListPage } from "./pages/headquarters-phones/HeadquartersPhonesListPage";
import { HeadquartersRepresentativeCreatePage } from "./pages/headquarters-representatives/HeadquartersRepresentativeCreatePage";
import { HeadquartersRepresentativeDetailPage } from "./pages/headquarters-representatives/HeadquartersRepresentativeDetailPage";
import { HeadquartersRepresentativeEditPage } from "./pages/headquarters-representatives/HeadquartersRepresentativeEditPage";
import { HeadquartersRepresentativeLocationHistoryPage, HeadquartersRepresentativeLocationPage } from "./pages/headquarters-representatives/HeadquartersRepresentativeLocationPage";
import { HeadquartersRepresentativesListPage } from "./pages/headquarters-representatives/HeadquartersRepresentativesListPage";
import { OrgUnitCreatePage } from "./pages/org-units/OrgUnitCreatePage";
import { OrgUnitDetailPage } from "./pages/org-units/OrgUnitDetailPage";
import { OrgUnitEditPage } from "./pages/org-units/OrgUnitEditPage";
import { OrgUnitLiaisonsPage } from "./pages/org-units/OrgUnitLiaisonsPage";
import { OrgUnitsListPage } from "./pages/org-units/OrgUnitsListPage";
import {
  UnitAccommodationLiaisonsPage,
  UnitCaravanLiaisonsPage,
} from "./pages/org-units/UnitLiaisonsListPages";
import { WalkingRouteCreatePage } from "./pages/walking-routes/WalkingRouteCreatePage";
import { WalkingRouteDetailPage } from "./pages/walking-routes/WalkingRouteDetailPage";
import { WalkingRouteEditPage } from "./pages/walking-routes/WalkingRouteEditPage";
import { WalkingRoutesListPage } from "./pages/walking-routes/WalkingRoutesListPage";
import { SupplierCreatePage } from "./pages/suppliers/SupplierCreatePage";
import { SupplierDetailPage } from "./pages/suppliers/SupplierDetailPage";
import { SupplierEditPage } from "./pages/suppliers/SupplierEditPage";
import { SuppliersListPage } from "./pages/suppliers/SuppliersListPage";
import { SupplierItemCreatePage } from "./pages/supplier-items/SupplierItemCreatePage";
import { SupplierItemDetailPage } from "./pages/supplier-items/SupplierItemDetailPage";
import { SupplierItemEditPage } from "./pages/supplier-items/SupplierItemEditPage";
import { SupplierItemsListPage } from "./pages/supplier-items/SupplierItemsListPage";
import { AccommodationLoanCreatePage } from "./pages/accommodation-loans/AccommodationLoanCreatePage";
import { AccommodationLoanDetailPage } from "./pages/accommodation-loans/AccommodationLoanDetailPage";
import { AccommodationLoanEditPage } from "./pages/accommodation-loans/AccommodationLoanEditPage";
import { AccommodationLoansListPage } from "./pages/accommodation-loans/AccommodationLoansListPage";
import { LoanReportPage } from "./pages/accommodation-loans/LoanReportPage";
import { ItemQuotaCreatePage } from "./pages/item-quotas/ItemQuotaCreatePage";
import { ItemQuotaDetailPage } from "./pages/item-quotas/ItemQuotaDetailPage";
import { ItemQuotaEditPage } from "./pages/item-quotas/ItemQuotaEditPage";
import { ItemQuotasListPage } from "./pages/item-quotas/ItemQuotasListPage";
import { IssueVoucherPage } from "./pages/item-quota-vouchers/IssueVoucherPage";
import { ItemQuotaVoucherCreatePage } from "./pages/item-quota-vouchers/ItemQuotaVoucherCreatePage";
import { ItemQuotaVoucherDetailPage } from "./pages/item-quota-vouchers/ItemQuotaVoucherDetailPage";
import { ItemQuotaVoucherEditPage } from "./pages/item-quota-vouchers/ItemQuotaVoucherEditPage";
import { ItemQuotaVouchersAdminListPage } from "./pages/item-quota-vouchers/ItemQuotaVouchersAdminListPage";
import { ItemQuotaVouchersListPage } from "./pages/item-quota-vouchers/ItemQuotaVouchersListPage";
import { ItemQuotaVoucherReportPage } from "./pages/item-quota-vouchers/ItemQuotaVoucherReportPage";
import { MyVoucherDetailPage } from "./pages/item-quota-vouchers/MyVoucherDetailPage";
import { MyVouchersListPage } from "./pages/item-quota-vouchers/MyVouchersListPage";
import { MyLoanDetailPage } from "./pages/accommodation-loans/MyLoanDetailPage";
import { MyLoansListPage } from "./pages/accommodation-loans/MyLoansListPage";
import {
  IceVoucherCreatePage,
  IceVoucherEditPage,
  MyIceVoucherCreatePage,
} from "./pages/ice-vouchers/MyIceVoucherCreatePage";
import { IceVoucherDetailPage } from "./pages/ice-vouchers/IceVoucherDetailPage";
import { IceVoucherReportPage } from "./pages/ice-vouchers/IceVoucherReportPage";
import { IceVouchersListPage } from "./pages/ice-vouchers/IceVouchersListPage";
import { LogisticsSettingsPage } from "./pages/ice-vouchers/LogisticsSettingsPage";
import { MyIceVoucherDetailPage } from "./pages/ice-vouchers/MyIceVoucherDetailPage";
import { MyIceVouchersListPage } from "./pages/ice-vouchers/MyIceVouchersListPage";
import { EvaluationCampaignCreatePage } from "./pages/evaluations/EvaluationCampaignCreatePage";
import { EvaluationCampaignDetailPage } from "./pages/evaluations/EvaluationCampaignDetailPage";
import { EvaluationCampaignEditPage } from "./pages/evaluations/EvaluationCampaignEditPage";
import { EvaluationCampaignsListPage } from "./pages/evaluations/EvaluationCampaignsListPage";
import { EvaluationDetailPage } from "./pages/evaluations/EvaluationDetailPage";
import { EvaluationQuestionCreatePage } from "./pages/evaluations/EvaluationQuestionCreatePage";
import { EvaluationQuestionDetailPage } from "./pages/evaluations/EvaluationQuestionDetailPage";
import { EvaluationQuestionEditPage } from "./pages/evaluations/EvaluationQuestionEditPage";
import { EvaluationQuestionsListPage } from "./pages/evaluations/EvaluationQuestionsListPage";
import { EvaluationSubmitPage } from "./pages/evaluations/EvaluationSubmitPage";
import { EvaluationsListPage } from "./pages/evaluations/EvaluationsListPage";
import { MyEvaluationsPage } from "./pages/evaluations/MyEvaluationsPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RequireMenuAccess } from "./routes/RequireMenuAccess";
import { PublicIceVoucherPage } from "./pages/public-vouchers/PublicIceVoucherPage";
import { PublicItemVoucherPage } from "./pages/public-vouchers/PublicItemVoucherPage";

const queryClient = new QueryClient();

function AppToaster() {
  const { i18n } = useTranslation();
  const lang = (i18n.language.split("-")[0] as AppLanguage) || "fa";
  return (
    <Toaster
      richColors
      position="bottom-center"
      className="app-toaster"
      swipeDirections={["bottom", "left", "right"]}
      dir={languages[lang]?.dir ?? "rtl"}
    />
  );
}

export default function App() {
  useSelectNumberOnFocus();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <NavigationHistoryProvider>
          <AppToaster />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/impersonate" element={<ImpersonateEntryPage />} />
            <Route path="/impersonate-ended" element={<ImpersonateEndedPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/v/item/:code" element={<PublicItemVoucherPage />} />
            <Route path="/v/ice/:code" element={<PublicIceVoucherPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route element={<RequireMenuAccess path="/my-location/history" />}>
                  <Route path="/my-location/history" element={<MyLocationHistoryPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/my-location" />}>
                  <Route path="/my-location" element={<MyLocationPage />} />
                </Route>
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/settings/password"
                  element={<ChangePasswordPage />}
                />
                <Route element={<RequireMenuAccess path="/pilgrims" />}>
                  <Route path="/pilgrims" element={<PilgrimsListPage />} />
                  <Route path="/pilgrims/new" element={<PilgrimCreatePage />} />
                  <Route
                    path="/pilgrims/import"
                    element={<PilgrimsImportPage />}
                  />
                  <Route
                    path="/pilgrims/:id/card"
                    element={<PilgrimCardPage />}
                  />
                  <Route
                    path="/pilgrims/:id/pilgrimage-history"
                    element={<PilgrimPilgrimageHistoryPage />}
                  />
                  <Route
                    path="/pilgrims/:id/sms"
                    element={<PilgrimSendSmsPage />}
                  />
                  <Route
                    path="/pilgrims/:id/password"
                    element={<PilgrimSetPasswordPage />}
                  />
                  <Route
                    path="/pilgrims/:id/edit"
                    element={<PilgrimEditPage />}
                  />
                  <Route
                    path="/pilgrims/:id/location/history"
                    element={<PilgrimLocationHistoryPage />}
                  />
                  <Route
                    path="/pilgrims/:id/location"
                    element={<PilgrimLocationPage />}
                  />
                  <Route path="/pilgrims/:id" element={<PilgrimDetailPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/pilgrim-report" />}>
                  <Route
                    path="/pilgrim-report"
                    element={<PilgrimsReportPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/caravans" />}>
                  <Route path="/caravans" element={<CaravansListPage />} />
                  <Route path="/caravans/new" element={<CaravanCreatePage />} />
                  <Route path="/caravans/import" element={<CaravanImportPage />} />
                  <Route
                    path="/caravans/:id/pilgrimage-history"
                    element={<CaravanPilgrimageHistoryPage />}
                  />
                  <Route
                    path="/caravans/:id/edit"
                    element={<CaravanEditPage />}
                  />
                  <Route path="/caravans/:id" element={<CaravanDetailPage />} />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/caravan-year-management" />
                  }
                >
                  <Route
                    path="/caravan-year-management"
                    element={<CaravanYearManagementPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/caravan-report" />}>
                  <Route
                    path="/caravan-report"
                    element={<CaravanReportPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/my-caravans" />}>
                  <Route path="/my-caravans" element={<MyCaravansListPage />} />
                  <Route
                    path="/my-caravans/new"
                    element={<MyCaravanCreatePage />}
                  />
                  <Route
                    path="/my-caravans/:id/pilgrimage-history"
                    element={<CaravanPilgrimageHistoryPage />}
                  />
                  <Route
                    path="/my-caravans/:id/edit"
                    element={<CaravanEditPage />}
                  />
                  <Route
                    path="/my-caravans/:id"
                    element={<CaravanDetailPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/groups" />}>
                  <Route path="/groups" element={<GroupsListPage />} />
                  <Route path="/groups/new" element={<GroupCreatePage />} />
                  <Route path="/groups/:id/edit" element={<GroupEditPage />} />
                  <Route path="/groups/:id" element={<GroupDetailPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/my-groups" />}>
                  <Route path="/my-groups" element={<MyGroupsListPage />} />
                  <Route
                    path="/my-groups/new"
                    element={<MyGroupCreatePage />}
                  />
                  <Route
                    path="/my-groups/:id/edit"
                    element={<GroupEditPage />}
                  />
                  <Route path="/my-groups/:id" element={<GroupDetailPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/my-reservations" />}>
                  <Route
                    path="/my-reservations"
                    element={<MyReservationsListPage />}
                  />
                  <Route
                    path="/my-reservations/new"
                    element={<ReservationCreatePage />}
                  />
                  <Route
                    path="/my-reservations/:id"
                    element={<ReservationWizardPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/reservation-stats" />}>
                  <Route
                    path="/reservation-stats"
                    element={<ReservationStatsPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/provincial-monitoring" />}
                >
                  <Route
                    path="/provincial-monitoring"
                    element={<ProvincialMonitoringMapPage />}
                  />
                  <Route
                    path="/provincial-monitoring/provinces/:provinceId"
                    element={<ProvincialMonitoringProvincePage />}
                  />
                  <Route
                    path="/provincial-monitoring/cities/:cityId"
                    element={<ProvincialMonitoringCityPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/national-monitoring" />}
                >
                  <Route
                    path="/national-monitoring"
                    element={<NationalMonitoringPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/reservations" />}>
                  <Route
                    path="/reservations"
                    element={<ReservationsAdminListPage />}
                  />
                  <Route
                    path="/reservations/new"
                    element={<ReservationCreatePage />}
                  />
                  <Route
                    path="/reservations/:id"
                    element={<ReservationAdminDetailPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/reception" />}>
                  <Route path="/reception" element={<ReceptionPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/support-request-report" />}>
                  <Route
                    path="/support-request-report"
                    element={<SupportRequestReportPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/support-requests" />}>
                  <Route
                    path="/support-requests"
                    element={<SupportRequestsListPage />}
                  />
                  <Route
                    path="/support-requests/new"
                    element={<SupportRequestCreatePage />}
                  />
                  <Route
                    path="/support-requests/:id"
                    element={<SupportRequestDetailPage />}
                  />
                  <Route
                    path="/support-requests/:id/edit"
                    element={<SupportRequestEditPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/reception-settings" />}
                >
                  <Route
                    path="/reception-settings"
                    element={<ReceptionSettingsPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/base-info/countries" />}
                >
                  <Route
                    path="/base-info/countries"
                    element={<CountriesListPage />}
                  />
                  <Route
                    path="/base-info/countries/new"
                    element={<CountryCreatePage />}
                  />
                  <Route
                    path="/base-info/countries/:id"
                    element={<CountryDetailPage />}
                  />
                  <Route
                    path="/base-info/countries/:id/edit"
                    element={<CountryEditPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/base-info/provinces" />}
                >
                  <Route
                    path="/base-info/provinces"
                    element={<ProvincesListPage />}
                  />
                  <Route
                    path="/base-info/provinces/new"
                    element={<ProvinceCreatePage />}
                  />
                  <Route
                    path="/base-info/provinces/:id"
                    element={<ProvinceDetailPage />}
                  />
                  <Route
                    path="/base-info/provinces/:id/edit"
                    element={<ProvinceEditPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/base-info/cities" />}>
                  <Route
                    path="/base-info/cities"
                    element={<CitiesListPage />}
                  />
                  <Route
                    path="/base-info/cities/new"
                    element={<CityCreatePage />}
                  />
                  <Route
                    path="/base-info/cities/:id"
                    element={<CityDetailPage />}
                  />
                  <Route
                    path="/base-info/cities/:id/edit"
                    element={<CityEditPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/base-info/entry-borders" />
                  }
                >
                  <Route
                    path="/base-info/entry-borders"
                    element={<EntryBordersListPage />}
                  />
                  <Route
                    path="/base-info/entry-borders/new"
                    element={<EntryBorderCreatePage />}
                  />
                  <Route
                    path="/base-info/entry-borders/:id"
                    element={<EntryBorderDetailPage />}
                  />
                  <Route
                    path="/base-info/entry-borders/:id/edit"
                    element={<EntryBorderEditPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/base-info/walking-routes" />
                  }
                >
                  <Route
                    path="/base-info/walking-routes"
                    element={<WalkingRoutesListPage />}
                  />
                  <Route
                    path="/base-info/walking-routes/new"
                    element={<WalkingRouteCreatePage />}
                  />
                  <Route
                    path="/base-info/walking-routes/:id"
                    element={<WalkingRouteDetailPage />}
                  />
                  <Route
                    path="/base-info/walking-routes/:id/edit"
                    element={<WalkingRouteEditPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/base-info/food-suppliers" />
                  }
                >
                  <Route
                    path="/base-info/food-suppliers"
                    element={<FoodSuppliersListPage />}
                  />
                  <Route
                    path="/base-info/food-suppliers/new"
                    element={<FoodSupplierCreatePage />}
                  />
                  <Route
                    path="/base-info/food-suppliers/:id"
                    element={<FoodSupplierDetailPage />}
                  />
                  <Route
                    path="/base-info/food-suppliers/:id/edit"
                    element={<FoodSupplierEditPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/base-info/benefactors" />}
                >
                  <Route
                    path="/base-info/benefactors"
                    element={<BenefactorsListPage />}
                  />
                  <Route
                    path="/base-info/benefactors/new"
                    element={<BenefactorCreatePage />}
                  />
                  <Route
                    path="/base-info/benefactors/:id"
                    element={<BenefactorDetailPage />}
                  />
                  <Route
                    path="/base-info/benefactors/:id/edit"
                    element={<BenefactorEditPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/base-info/government-organizations" />
                  }
                >
                  <Route
                    path="/base-info/government-organizations"
                    element={<GovernmentOrganizationsListPage />}
                  />
                  <Route
                    path="/base-info/government-organizations/new"
                    element={<GovernmentOrganizationCreatePage />}
                  />
                  <Route
                    path="/base-info/government-organizations/:id"
                    element={<GovernmentOrganizationDetailPage />}
                  />
                  <Route
                    path="/base-info/government-organizations/:id/edit"
                    element={<GovernmentOrganizationEditPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/base-info/places" />}>
                  <Route
                    path="/base-info/places"
                    element={<PlacesListPage />}
                  />
                  <Route
                    path="/base-info/places/new"
                    element={<PlaceCreatePage />}
                  />
                  <Route
                    path="/base-info/places/types"
                    element={<PlaceTypesListPage />}
                  />
                  <Route
                    path="/base-info/places/types/new"
                    element={<PlaceTypeCreatePage />}
                  />
                  <Route
                    path="/base-info/places/types/:id"
                    element={<PlaceTypeDetailPage />}
                  />
                  <Route
                    path="/base-info/places/types/:id/edit"
                    element={<PlaceTypeEditPage />}
                  />
                  <Route
                    path="/base-info/places/:id"
                    element={<PlaceDetailPage />}
                  />
                  <Route
                    path="/base-info/places/:id/edit"
                    element={<PlaceEditPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/licenses/new" />}>
                  <Route
                    path="/licenses/new"
                    element={<IssueLicensePage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/licenses/issued" />}>
                  <Route
                    path="/licenses/issued"
                    element={<IssuedLicensesPage />}
                  />
                  <Route
                    path="/licenses/issued/:id"
                    element={<IssuedLicenseDetailPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/sms/settings" />}>
                  <Route path="/sms/settings" element={<SmsSettingsPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/sms/send" />}>
                  <Route path="/sms/send" element={<SmsSendPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/sms/report" />}>
                  <Route path="/sms/report" element={<SmsReportPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/users" />}>
                  <Route path="/users" element={<UsersListPage />} />
                  <Route path="/users/new" element={<UserCreatePage />} />
                  <Route path="/users/:id" element={<UserDetailPage />} />
                  <Route path="/users/:id/edit" element={<UserEditPage />} />
                  <Route path="/users/:id/location/history" element={<UserLocationHistoryPage />} />
                  <Route path="/users/:id/location" element={<UserLocationPage />} />
                </Route>
                <Route element={<RequireMenuAccess path="/caravan-managers" />}>
                  <Route
                    path="/caravan-managers"
                    element={<CaravanManagersListPage />}
                  />
                  <Route
                    path="/caravan-managers/new"
                    element={<CaravanManagerCreatePage />}
                  />
                  <Route
                    path="/caravan-managers/:id"
                    element={<CaravanManagerDetailPage />}
                  />
                  <Route
                    path="/caravan-managers/:id/edit"
                    element={<CaravanManagerEditPage />}
                  />
                  <Route
                    path="/caravan-managers/:id/location/history"
                    element={<CaravanManagerLocationHistoryPage />}
                  />
                  <Route
                    path="/caravan-managers/:id/location"
                    element={<CaravanManagerLocationPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/accommodation-managers" />}
                >
                  <Route
                    path="/accommodation-managers"
                    element={<AccommodationManagersListPage />}
                  />
                  <Route
                    path="/accommodation-managers/new"
                    element={<AccommodationManagerCreatePage />}
                  />
                  <Route
                    path="/accommodation-managers/:id"
                    element={<AccommodationManagerDetailPage />}
                  />
                  <Route
                    path="/accommodation-managers/:id/edit"
                    element={<AccommodationManagerEditPage />}
                  />
                  <Route
                    path="/accommodation-managers/:id/location/history"
                    element={<AccommodationManagerLocationHistoryPage />}
                  />
                  <Route
                    path="/accommodation-managers/:id/location"
                    element={<AccommodationManagerLocationPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/headquarters/info" />}
                >
                  <Route
                    path="/headquarters/info"
                    element={<HeadquartersInfoListPage />}
                  />
                  <Route
                    path="/headquarters/info/new"
                    element={<HeadquartersInfoCreatePage />}
                  />
                  <Route
                    path="/headquarters/info/:id/phones"
                    element={<HeadquartersPhonesListPage />}
                  />
                  <Route
                    path="/headquarters/info/:id/phones/new"
                    element={<HeadquartersPhoneCreatePage />}
                  />
                  <Route
                    path="/headquarters/info/:id/phones/:phoneId"
                    element={<HeadquartersPhoneDetailPage />}
                  />
                  <Route
                    path="/headquarters/info/:id/phones/:phoneId/edit"
                    element={<HeadquartersPhoneEditPage />}
                  />
                  <Route
                    path="/headquarters/info/:id"
                    element={<HeadquartersInfoDetailPage />}
                  />
                  <Route
                    path="/headquarters/info/:id/edit"
                    element={<HeadquartersInfoEditPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/headquarters/representatives" />
                  }
                >
                  <Route
                    path="/headquarters/representatives"
                    element={<HeadquartersRepresentativesListPage />}
                  />
                  <Route
                    path="/headquarters/representatives/new"
                    element={<HeadquartersRepresentativeCreatePage />}
                  />
                  <Route
                    path="/headquarters/representatives/:id"
                    element={<HeadquartersRepresentativeDetailPage />}
                  />
                  <Route
                    path="/headquarters/representatives/:id/edit"
                    element={<HeadquartersRepresentativeEditPage />}
                  />
                  <Route
                    path="/headquarters/representatives/:id/location/history"
                    element={<HeadquartersRepresentativeLocationHistoryPage />}
                  />
                  <Route
                    path="/headquarters/representatives/:id/location"
                    element={<HeadquartersRepresentativeLocationPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/headquarters/units" />}
                >
                  <Route
                    path="/headquarters/units"
                    element={<OrgUnitsListPage />}
                  />
                  <Route
                    path="/headquarters/units/new"
                    element={<OrgUnitCreatePage />}
                  />
                  <Route
                    path="/headquarters/units/:id/liaisons"
                    element={<OrgUnitLiaisonsPage />}
                  />
                  <Route
                    path="/headquarters/units/:id"
                    element={<OrgUnitDetailPage />}
                  />
                  <Route
                    path="/headquarters/units/:id/edit"
                    element={<OrgUnitEditPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/headquarters/accommodation-liaisons" />
                  }
                >
                  <Route
                    path="/headquarters/accommodation-liaisons"
                    element={<UnitAccommodationLiaisonsPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/headquarters/caravan-liaisons" />
                  }
                >
                  <Route
                    path="/headquarters/caravan-liaisons"
                    element={<UnitCaravanLiaisonsPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/my-accommodations" />}>
                  <Route
                    path="/my-accommodations"
                    element={<MyAccommodationsListPage />}
                  />
                  <Route
                    path="/my-accommodations/new"
                    element={<MyAccommodationCreatePage />}
                  />
                  <Route
                    path="/my-accommodations/:id"
                    element={<AccommodationDetailPage />}
                  />
                  <Route
                    path="/my-accommodations/:id/edit"
                    element={<AccommodationEditPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess
                      path="/accommodations"
                      allowModule="accommodation"
                    />
                  }
                >
                  <Route
                    path="/accommodations"
                    element={<AccommodationsListPage />}
                  />
                  <Route
                    path="/accommodations/:id"
                    element={<AccommodationDetailPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/accommodations" />}>
                  <Route
                    path="/accommodations/new"
                    element={<AccommodationCreatePage />}
                  />
                  <Route
                    path="/accommodations/:id/edit"
                    element={<AccommodationEditPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/placements" />}>
                  <Route path="/placements" element={<PlacementsListPage />} />
                  <Route
                    path="/placements/vacate"
                    element={<PlacementVacatePage />}
                  />
                  <Route
                    path="/placements/:reservationId"
                    element={<PlacementDetailPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/accommodation-year-management" />
                  }
                >
                  <Route
                    path="/accommodation-year-management"
                    element={<AccommodationYearManagementPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/accommodation-report" />}
                >
                  <Route
                    path="/accommodation-report"
                    element={<AccommodationReportPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/logistics/suppliers" />}
                >
                  <Route
                    path="/logistics/suppliers"
                    element={<SuppliersListPage />}
                  />
                  <Route
                    path="/logistics/suppliers/new"
                    element={<SupplierCreatePage />}
                  />
                  <Route
                    path="/logistics/suppliers/:supplierId/items"
                    element={<SupplierItemsListPage />}
                  />
                  <Route
                    path="/logistics/suppliers/:supplierId/items/new"
                    element={<SupplierItemCreatePage />}
                  />
                  <Route
                    path="/logistics/suppliers/:supplierId/items/:id"
                    element={<SupplierItemDetailPage />}
                  />
                  <Route
                    path="/logistics/suppliers/:supplierId/items/:id/edit"
                    element={<SupplierItemEditPage />}
                  />
                  <Route
                    path="/logistics/suppliers/:id"
                    element={<SupplierDetailPage />}
                  />
                  <Route
                    path="/logistics/suppliers/:id/edit"
                    element={<SupplierEditPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/logistics/loans" />}>
                  <Route
                    path="/logistics/loans"
                    element={<AccommodationLoansListPage />}
                  />
                  <Route
                    path="/logistics/loans/new"
                    element={<AccommodationLoanCreatePage />}
                  />
                  <Route
                    path="/logistics/loans/:id"
                    element={<AccommodationLoanDetailPage />}
                  />
                  <Route
                    path="/logistics/loans/:id/edit"
                    element={<AccommodationLoanEditPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/logistics/loan-report" />}
                >
                  <Route
                    path="/logistics/loan-report"
                    element={<LoanReportPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/logistics/item-quotas" />}
                >
                  <Route
                    path="/logistics/item-quotas"
                    element={<ItemQuotasListPage />}
                  />
                  <Route
                    path="/logistics/item-quotas/new"
                    element={<ItemQuotaCreatePage />}
                  />
                  <Route
                    path="/logistics/item-quotas/:quotaId/vouchers"
                    element={<ItemQuotaVouchersListPage />}
                  />
                  <Route
                    path="/logistics/item-quotas/:quotaId/vouchers/new"
                    element={<ItemQuotaVoucherCreatePage />}
                  />
                  <Route
                    path="/logistics/item-quotas/:quotaId/vouchers/:id"
                    element={<ItemQuotaVoucherDetailPage />}
                  />
                  <Route
                    path="/logistics/item-quotas/:quotaId/vouchers/:id/edit"
                    element={<ItemQuotaVoucherEditPage />}
                  />
                  <Route
                    path="/logistics/item-quotas/:id"
                    element={<ItemQuotaDetailPage />}
                  />
                  <Route
                    path="/logistics/item-quotas/:id/edit"
                    element={<ItemQuotaEditPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/logistics/issue-voucher" />
                  }
                >
                  <Route
                    path="/logistics/issue-voucher"
                    element={<IssueVoucherPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/logistics/vouchers" />}
                >
                  <Route
                    path="/logistics/vouchers"
                    element={<ItemQuotaVouchersAdminListPage />}
                  />
                  <Route
                    path="/logistics/vouchers/new"
                    element={
                      <IssueVoucherPage
                        titleKey="itemQuotaVouchers.create"
                        successPath={(id) => `/logistics/vouchers/${id}`}
                      />
                    }
                  />
                  <Route
                    path="/logistics/vouchers/:id"
                    element={<ItemQuotaVoucherDetailPage />}
                  />
                  <Route
                    path="/logistics/vouchers/:id/edit"
                    element={<ItemQuotaVoucherEditPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/logistics/voucher-report" />
                  }
                >
                  <Route
                    path="/logistics/voucher-report"
                    element={<ItemQuotaVoucherReportPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/logistics/my-vouchers" />}
                >
                  <Route
                    path="/logistics/my-vouchers"
                    element={<MyVouchersListPage />}
                  />
                  <Route
                    path="/logistics/my-vouchers/:id"
                    element={<MyVoucherDetailPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/logistics/my-loans" />}
                >
                  <Route
                    path="/logistics/my-loans"
                    element={<MyLoansListPage />}
                  />
                  <Route
                    path="/logistics/my-loans/:id"
                    element={<MyLoanDetailPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/logistics/settings" />}
                >
                  <Route
                    path="/logistics/settings"
                    element={<LogisticsSettingsPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/logistics/ice-vouchers" />}
                >
                  <Route
                    path="/logistics/ice-vouchers"
                    element={<IceVouchersListPage />}
                  />
                  <Route
                    path="/logistics/ice-vouchers/new"
                    element={
                      <IceVoucherCreatePage basePath="/logistics/ice-vouchers" />
                    }
                  />
                  <Route
                    path="/logistics/ice-vouchers/:id/edit"
                    element={<IceVoucherEditPage />}
                  />
                  <Route
                    path="/logistics/ice-vouchers/:id"
                    element={<IceVoucherDetailPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/logistics/my-ice-vouchers" />
                  }
                >
                  <Route
                    path="/logistics/my-ice-vouchers"
                    element={<MyIceVouchersListPage />}
                  />
                  <Route
                    path="/logistics/my-ice-vouchers/new"
                    element={<MyIceVoucherCreatePage />}
                  />
                  <Route
                    path="/logistics/my-ice-vouchers/:id"
                    element={<MyIceVoucherDetailPage />}
                  />
                </Route>
                <Route
                  element={
                    <RequireMenuAccess path="/logistics/ice-voucher-report" />
                  }
                >
                  <Route
                    path="/logistics/ice-voucher-report"
                    element={<IceVoucherReportPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/evaluations/campaigns" />}
                >
                  <Route
                    path="/evaluations/campaigns"
                    element={<EvaluationCampaignsListPage />}
                  />
                  <Route
                    path="/evaluations/campaigns/new"
                    element={<EvaluationCampaignCreatePage />}
                  />
                  <Route
                    path="/evaluations/campaigns/:id"
                    element={<EvaluationCampaignDetailPage />}
                  />
                  <Route
                    path="/evaluations/campaigns/:id/edit"
                    element={<EvaluationCampaignEditPage />}
                  />
                </Route>
                <Route
                  element={<RequireMenuAccess path="/evaluations/questions" />}
                >
                  <Route
                    path="/evaluations/questions"
                    element={<EvaluationQuestionsListPage />}
                  />
                  <Route
                    path="/evaluations/questions/new"
                    element={<EvaluationQuestionCreatePage />}
                  />
                  <Route
                    path="/evaluations/questions/:id"
                    element={<EvaluationQuestionDetailPage />}
                  />
                  <Route
                    path="/evaluations/questions/:id/edit"
                    element={<EvaluationQuestionEditPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/evaluations/submit" />}>
                  <Route
                    path="/evaluations/submit"
                    element={<EvaluationSubmitPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/evaluations" />}>
                  <Route path="/evaluations" element={<EvaluationsListPage />} />
                  <Route
                    path="/evaluations/:id"
                    element={<EvaluationDetailPage />}
                  />
                </Route>
                <Route element={<RequireMenuAccess path="/my-evaluations" />}>
                  <Route
                    path="/my-evaluations"
                    element={<MyEvaluationsPage />}
                  />
                  <Route
                    path="/my-evaluations/:id"
                    element={<EvaluationDetailPage />}
                  />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </NavigationHistoryProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
