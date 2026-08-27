export function getPageMeta(pathname: string): {
  titleKey: string;
  subtitleKey?: string;
} {
  if (pathname.startsWith("/settings/password")) {
    return {
      titleKey: "auth.changePassword",
      subtitleKey: "auth.changePasswordSubtitle",
    };
  }
  if (pathname.startsWith("/account")) {
    return { titleKey: "account.title", subtitleKey: "account.subtitle" };
  }
  if (pathname.startsWith("/my-location")) {
    return {
      titleKey: "location.register",
      subtitleKey: "location.registerSubtitle",
    };
  }
  if (pathname.startsWith("/settings")) {
    return { titleKey: "settings.title", subtitleKey: "settings.subtitle" };
  }
  if (pathname.startsWith("/pilgrim-report")) {
    return {
      titleKey: "menus.pilgrimsReport",
      subtitleKey: "pilgrimReports.subtitle",
    };
  }
  if (pathname.startsWith("/pilgrims/new")) {
    return {
      titleKey: "pilgrims.create",
      subtitleKey: "pilgrims.createSubtitle",
    };
  }
  if (pathname.startsWith("/pilgrims/import")) {
    return {
      titleKey: "pilgrims.import",
      subtitleKey: "pilgrims.importSubtitle",
    };
  }
  if (pathname.includes("/sms") && pathname.startsWith("/pilgrims/")) {
    return {
      titleKey: "pilgrims.sendSms",
      subtitleKey: "pilgrims.sendSmsSubtitle",
    };
  }
  if (pathname.includes("/password") && pathname.startsWith("/pilgrims/")) {
    return {
      titleKey: "pilgrims.setPassword",
      subtitleKey: "pilgrims.setPasswordSubtitle",
    };
  }
  if (pathname.includes("/card") && pathname.startsWith("/pilgrims/")) {
    return { titleKey: "pilgrims.card", subtitleKey: "pilgrims.cardSubtitle" };
  }
  if (
    pathname.includes("/pilgrimage-history") &&
    pathname.startsWith("/pilgrims/")
  ) {
    return {
      titleKey: "pilgrims.pilgrimageHistory",
      subtitleKey: "pilgrims.pilgrimageHistorySubtitle",
    };
  }
  if (pathname.includes("/location") && pathname.startsWith("/pilgrims/")) {
    return {
      titleKey: "location.register",
      subtitleKey: "location.registerSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/pilgrims/")) {
    return { titleKey: "pilgrims.edit", subtitleKey: "pilgrims.editSubtitle" };
  }
  if (pathname.startsWith("/pilgrims/") && pathname !== "/pilgrims") {
    return {
      titleKey: "pilgrims.details",
      subtitleKey: "pilgrims.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/pilgrims")) {
    return { titleKey: "menus.pilgrimsList", subtitleKey: "pilgrims.subtitle" };
  }
  if (pathname.startsWith("/caravans/new")) {
    return {
      titleKey: "caravans.create",
      subtitleKey: "caravans.createSubtitle",
    };
  }
  if (pathname.startsWith("/caravans/import")) {
    return {
      titleKey: "caravans.import",
      subtitleKey: "caravans.importSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/caravans/")) {
    return { titleKey: "caravans.edit", subtitleKey: "caravans.editSubtitle" };
  }
  if (
    pathname.includes("/pilgrimage-history") &&
    pathname.startsWith("/caravans/")
  ) {
    return {
      titleKey: "caravanPilgrimageHistory.title",
      subtitleKey: "caravanPilgrimageHistory.subtitle",
    };
  }
  if (pathname.startsWith("/caravans/") && pathname !== "/caravans") {
    return {
      titleKey: "caravans.details",
      subtitleKey: "caravans.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/caravans")) {
    return { titleKey: "menus.caravansList", subtitleKey: "caravans.subtitle" };
  }
  if (
    pathname.includes("/pilgrimage-history") &&
    pathname.startsWith("/my-caravans/")
  ) {
    return {
      titleKey: "caravanPilgrimageHistory.title",
      subtitleKey: "caravanPilgrimageHistory.subtitle",
    };
  }
  if (pathname.startsWith("/my-caravans/new")) {
    return {
      titleKey: "caravans.create",
      subtitleKey: "myCaravans.createSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/my-caravans/")) {
    return { titleKey: "caravans.edit", subtitleKey: "caravans.editSubtitle" };
  }
  if (pathname.startsWith("/my-caravans/") && pathname !== "/my-caravans") {
    return {
      titleKey: "caravans.details",
      subtitleKey: "caravans.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/my-caravans")) {
    return { titleKey: "menus.myCaravans", subtitleKey: "myCaravans.subtitle" };
  }
  if (pathname.startsWith("/groups/new")) {
    return {
      titleKey: "groups.create",
      subtitleKey: "groups.createSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/groups/")) {
    return { titleKey: "groups.edit", subtitleKey: "groups.editSubtitle" };
  }
  if (pathname.startsWith("/groups/") && pathname !== "/groups") {
    return {
      titleKey: "groups.details",
      subtitleKey: "groups.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/groups")) {
    return { titleKey: "menus.groupsList", subtitleKey: "groups.subtitle" };
  }
  if (pathname.startsWith("/my-groups/new")) {
    return {
      titleKey: "groups.create",
      subtitleKey: "myGroups.createSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/my-groups/")) {
    return { titleKey: "groups.edit", subtitleKey: "groups.editSubtitle" };
  }
  if (pathname.startsWith("/my-groups/") && pathname !== "/my-groups") {
    return {
      titleKey: "groups.details",
      subtitleKey: "groups.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/my-groups")) {
    return { titleKey: "menus.myGroups", subtitleKey: "myGroups.subtitle" };
  }
  if (pathname.startsWith("/my-reservations/new")) {
    return { titleKey: "reservations.createPageTitle" };
  }
  if (
    pathname.startsWith("/my-reservations/") &&
    pathname !== "/my-reservations"
  ) {
    return {
      titleKey: "reservations.wizard",
      subtitleKey: "reservations.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/my-reservations")) {
    return { titleKey: "menus.myReservations" };
  }
  if (pathname.startsWith("/support-request-report")) {
    return {
      titleKey: "menus.supportRequestReport",
      subtitleKey: "supportRequestReports.subtitle",
    };
  }
  if (pathname.startsWith("/support-requests/new")) {
    return {
      titleKey: "supportRequests.create",
      subtitleKey: "supportRequests.createSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/support-requests/")) {
    return {
      titleKey: "supportRequests.edit",
      subtitleKey: "supportRequests.editSubtitle",
    };
  }
  if (pathname.startsWith("/support-requests/") && pathname !== "/support-requests") {
    return {
      titleKey: "supportRequests.details",
      subtitleKey: "supportRequests.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/support-requests")) {
    return {
      titleKey: "menus.supportRequests",
      subtitleKey: "supportRequests.subtitle",
    };
  }
  if (pathname.startsWith("/reception-settings")) {
    return {
      titleKey: "menus.receptionSettings",
      subtitleKey: "receptionSettings.subtitle",
    };
  }
  if (pathname === "/reception" || pathname.startsWith("/reception/")) {
    return { titleKey: "menus.reception", subtitleKey: "reception.subtitle" };
  }
  if (pathname.startsWith("/reservation-stats")) {
    return {
      titleKey: "menus.reservationsReport",
      subtitleKey: "reservations.statsSubtitle",
    };
  }
  if (pathname.startsWith("/provincial-monitoring/provinces/")) {
    return {
      titleKey: "provincialMonitoring.provinceDetails",
      subtitleKey: "provincialMonitoring.subtitle",
    };
  }
  if (pathname.startsWith("/provincial-monitoring/cities/")) {
    return {
      titleKey: "provincialMonitoring.cityDetails",
      subtitleKey: "provincialMonitoring.subtitle",
    };
  }
  if (pathname.startsWith("/provincial-monitoring")) {
    return {
      titleKey: "menus.provincialMonitoring",
      subtitleKey: "provincialMonitoring.subtitle",
    };
  }
  if (pathname.startsWith("/national-monitoring")) {
    return {
      titleKey: "menus.nationalMonitoring",
      subtitleKey: "nationalMonitoring.subtitle",
    };
  }
  if (pathname.startsWith("/reservations/new")) {
    return { titleKey: "reservations.createPageTitle" };
  }
  if (pathname.startsWith("/reservations/") && pathname !== "/reservations") {
    return {
      titleKey: "reservations.adminDetails",
      subtitleKey: "reservations.adminDetailsSubtitle",
    };
  }
  if (pathname.startsWith("/reservations")) {
    return {
      titleKey: "menus.reservationsAdmin",
      subtitleKey: "reservations.adminSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/countries/new")) {
    return {
      titleKey: "countries.create",
      subtitleKey: "countries.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/base-info/countries/")
  ) {
    return {
      titleKey: "countries.edit",
      subtitleKey: "countries.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/base-info/countries/") &&
    pathname !== "/base-info/countries"
  ) {
    return {
      titleKey: "countries.details",
      subtitleKey: "countries.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/countries")) {
    return { titleKey: "menus.countries", subtitleKey: "countries.subtitle" };
  }
  if (pathname.startsWith("/base-info/provinces/new")) {
    return {
      titleKey: "provinces.create",
      subtitleKey: "provinces.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/base-info/provinces/")
  ) {
    return {
      titleKey: "provinces.edit",
      subtitleKey: "provinces.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/base-info/provinces/") &&
    pathname !== "/base-info/provinces"
  ) {
    return {
      titleKey: "provinces.details",
      subtitleKey: "provinces.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/provinces")) {
    return { titleKey: "menus.provinces", subtitleKey: "provinces.subtitle" };
  }
  if (pathname.startsWith("/base-info/cities/new")) {
    return { titleKey: "cities.create", subtitleKey: "cities.createSubtitle" };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/base-info/cities/")) {
    return { titleKey: "cities.edit", subtitleKey: "cities.editSubtitle" };
  }
  if (
    pathname.startsWith("/base-info/cities/") &&
    pathname !== "/base-info/cities"
  ) {
    return {
      titleKey: "cities.details",
      subtitleKey: "cities.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/cities")) {
    return { titleKey: "menus.cities", subtitleKey: "cities.subtitle" };
  }
  if (pathname.startsWith("/base-info/entry-borders/new")) {
    return {
      titleKey: "entryBorders.create",
      subtitleKey: "entryBorders.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/base-info/entry-borders/")
  ) {
    return {
      titleKey: "entryBorders.edit",
      subtitleKey: "entryBorders.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/base-info/entry-borders/") &&
    pathname !== "/base-info/entry-borders"
  ) {
    return {
      titleKey: "entryBorders.details",
      subtitleKey: "entryBorders.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/entry-borders")) {
    return {
      titleKey: "menus.entryBorders",
      subtitleKey: "entryBorders.subtitle",
    };
  }
  if (pathname.startsWith("/base-info/walking-routes/new")) {
    return {
      titleKey: "walkingRoutes.create",
      subtitleKey: "walkingRoutes.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/base-info/walking-routes/")
  ) {
    return {
      titleKey: "walkingRoutes.edit",
      subtitleKey: "walkingRoutes.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/base-info/walking-routes/") &&
    pathname !== "/base-info/walking-routes"
  ) {
    return {
      titleKey: "walkingRoutes.details",
      subtitleKey: "walkingRoutes.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/walking-routes")) {
    return {
      titleKey: "menus.walkingRoutes",
      subtitleKey: "walkingRoutes.subtitle",
    };
  }
  if (pathname.startsWith("/base-info/food-suppliers/new")) {
    return {
      titleKey: "foodSuppliers.create",
      subtitleKey: "foodSuppliers.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/base-info/food-suppliers/")
  ) {
    return {
      titleKey: "foodSuppliers.edit",
      subtitleKey: "foodSuppliers.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/base-info/food-suppliers/") &&
    pathname !== "/base-info/food-suppliers"
  ) {
    return {
      titleKey: "foodSuppliers.details",
      subtitleKey: "foodSuppliers.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/food-suppliers")) {
    return {
      titleKey: "menus.foodSuppliers",
      subtitleKey: "foodSuppliers.subtitle",
    };
  }
  if (pathname.startsWith("/base-info/medical-centers/new")) {
    return {
      titleKey: "medicalCenters.create",
      subtitleKey: "medicalCenters.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/base-info/medical-centers/")
  ) {
    return {
      titleKey: "medicalCenters.edit",
      subtitleKey: "medicalCenters.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/base-info/medical-centers/") &&
    pathname !== "/base-info/medical-centers"
  ) {
    return {
      titleKey: "medicalCenters.details",
      subtitleKey: "medicalCenters.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/medical-centers")) {
    return {
      titleKey: "menus.medicalCenters",
      subtitleKey: "medicalCenters.subtitle",
    };
  }
  if (pathname.startsWith("/base-info/red-crescents/new")) {
    return {
      titleKey: "redCrescents.create",
      subtitleKey: "redCrescents.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/base-info/red-crescents/")
  ) {
    return {
      titleKey: "redCrescents.edit",
      subtitleKey: "redCrescents.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/base-info/red-crescents/") &&
    pathname !== "/base-info/red-crescents"
  ) {
    return {
      titleKey: "redCrescents.details",
      subtitleKey: "redCrescents.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/red-crescents")) {
    return {
      titleKey: "menus.redCrescents",
      subtitleKey: "redCrescents.subtitle",
    };
  }
  if (pathname.startsWith("/base-info/benefactors/new")) {
    return {
      titleKey: "benefactors.create",
      subtitleKey: "benefactors.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/base-info/benefactors/")
  ) {
    return {
      titleKey: "benefactors.edit",
      subtitleKey: "benefactors.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/base-info/benefactors/") &&
    pathname !== "/base-info/benefactors"
  ) {
    return {
      titleKey: "benefactors.details",
      subtitleKey: "benefactors.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/benefactors")) {
    return {
      titleKey: "menus.benefactors",
      subtitleKey: "benefactors.subtitle",
    };
  }
  if (pathname.startsWith("/base-info/government-organizations/new")) {
    return {
      titleKey: "governmentOrganizations.create",
      subtitleKey: "governmentOrganizations.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/base-info/government-organizations/")
  ) {
    return {
      titleKey: "governmentOrganizations.edit",
      subtitleKey: "governmentOrganizations.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/base-info/government-organizations/") &&
    pathname !== "/base-info/government-organizations"
  ) {
    return {
      titleKey: "governmentOrganizations.details",
      subtitleKey: "governmentOrganizations.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/base-info/government-organizations")) {
    return {
      titleKey: "menus.governmentOrganizations",
      subtitleKey: "governmentOrganizations.subtitle",
    };
  }
  if (pathname.startsWith("/licenses/new")) {
    return {
      titleKey: "menus.issueLicense",
      subtitleKey: "licenses.issueSubtitle",
    };
  }
  if (
    pathname.startsWith("/licenses/issued/") &&
    pathname !== "/licenses/issued"
  ) {
    return {
      titleKey: "licenses.details",
      subtitleKey: "licenses.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/licenses/issued")) {
    return {
      titleKey: "menus.issuedLicenses",
      subtitleKey: "licenses.issuedSubtitle",
    };
  }
  if (pathname.startsWith("/headquarters/info/new")) {
    return {
      titleKey: "headquartersInfo.create",
      subtitleKey: "headquartersInfo.createSubtitle",
    };
  }
  if (
    pathname.includes("/phones/new") &&
    pathname.startsWith("/headquarters/info/")
  ) {
    return {
      titleKey: "headquartersPhones.create",
      subtitleKey: "headquartersPhones.createSubtitle",
    };
  }
  if (
    pathname.includes("/phones/") &&
    pathname.includes("/edit") &&
    pathname.startsWith("/headquarters/info/")
  ) {
    return {
      titleKey: "headquartersPhones.edit",
      subtitleKey: "headquartersPhones.editSubtitle",
    };
  }
  if (
    pathname.includes("/phones/") &&
    pathname.startsWith("/headquarters/info/")
  ) {
    return {
      titleKey: "headquartersPhones.details",
      subtitleKey: "headquartersPhones.detailsSubtitle",
    };
  }
  if (
    pathname.includes("/phones") &&
    pathname.startsWith("/headquarters/info/")
  ) {
    return {
      titleKey: "headquartersPhones.title",
      subtitleKey: "headquartersPhones.subtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/headquarters/info/")
  ) {
    return {
      titleKey: "headquartersInfo.edit",
      subtitleKey: "headquartersInfo.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/headquarters/info/") &&
    pathname !== "/headquarters/info"
  ) {
    return {
      titleKey: "headquartersInfo.details",
      subtitleKey: "headquartersInfo.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/headquarters/info")) {
    return {
      titleKey: "menus.headquartersInfo",
      subtitleKey: "headquartersInfo.subtitle",
    };
  }
  if (pathname.startsWith("/headquarters/representatives/new")) {
    return {
      titleKey: "headquartersRepresentatives.create",
      subtitleKey: "headquartersRepresentatives.createSubtitle",
    };
  }
  if (
    pathname.includes("/location") &&
    pathname.startsWith("/headquarters/representatives/")
  ) {
    return {
      titleKey: "location.register",
      subtitleKey: "location.registerSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/headquarters/representatives/")
  ) {
    return {
      titleKey: "headquartersRepresentatives.edit",
      subtitleKey: "headquartersRepresentatives.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/headquarters/representatives/") &&
    pathname !== "/headquarters/representatives"
  ) {
    return {
      titleKey: "headquartersRepresentatives.details",
      subtitleKey: "headquartersRepresentatives.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/headquarters/representatives")) {
    return {
      titleKey: "menus.headquartersRepresentatives",
      subtitleKey: "headquartersRepresentatives.subtitle",
    };
  }
  if (pathname.startsWith("/headquarters/units/new")) {
    return {
      titleKey: "orgUnits.create",
      subtitleKey: "orgUnits.createSubtitle",
    };
  }
  if (
    pathname.includes("/liaisons") &&
    pathname.startsWith("/headquarters/units/")
  ) {
    return {
      titleKey: "orgUnits.manageLiaisons",
      subtitleKey: "orgUnits.manageLiaisonsSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/headquarters/units/")
  ) {
    return {
      titleKey: "orgUnits.edit",
      subtitleKey: "orgUnits.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/headquarters/units/") &&
    pathname !== "/headquarters/units"
  ) {
    return {
      titleKey: "orgUnits.details",
      subtitleKey: "orgUnits.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/headquarters/units")) {
    return {
      titleKey: "menus.orgUnits",
      subtitleKey: "orgUnits.subtitle",
    };
  }
  if (pathname.startsWith("/headquarters/accommodation-liaisons")) {
    return {
      titleKey: "menus.unitAccommodationLiaisons",
      subtitleKey: "unitAccommodationLiaisons.subtitle",
    };
  }
  if (pathname.startsWith("/headquarters/caravan-liaisons")) {
    return {
      titleKey: "menus.unitCaravanLiaisons",
      subtitleKey: "unitCaravanLiaisons.subtitle",
    };
  }
  if (pathname.startsWith("/sms/settings")) {
    return {
      titleKey: "menus.smsSettings",
      subtitleKey: "sms.settingsSubtitle",
    };
  }
  if (pathname.startsWith("/sms/send")) {
    return { titleKey: "menus.smsSend", subtitleKey: "sms.sendSubtitle" };
  }
  if (pathname.startsWith("/sms/report")) {
    return { titleKey: "menus.smsReport", subtitleKey: "sms.reportSubtitle" };
  }
  if (pathname.startsWith("/users/new")) {
    return { titleKey: "users.create", subtitleKey: "users.createSubtitle" };
  }
  if (pathname.includes("/location") && pathname.startsWith("/users/")) {
    return {
      titleKey: "location.register",
      subtitleKey: "location.registerSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/users/")) {
    return { titleKey: "users.edit", subtitleKey: "users.editSubtitle" };
  }
  if (pathname.startsWith("/users/") && pathname !== "/users") {
    return { titleKey: "users.details", subtitleKey: "users.detailsSubtitle" };
  }
  if (pathname.startsWith("/users")) {
    return { titleKey: "menus.usersList", subtitleKey: "users.subtitle" };
  }
  if (pathname.startsWith("/caravan-year-management")) {
    return {
      titleKey: "menus.caravanYearManagement",
      subtitleKey: "caravanYearManagement.subtitle",
    };
  }
  if (pathname.startsWith("/caravan-report")) {
    return {
      titleKey: "menus.caravanReport",
      subtitleKey: "caravans.reportSubtitle",
    };
  }
  if (pathname.startsWith("/caravan-managers/new")) {
    return {
      titleKey: "caravanManagers.create",
      subtitleKey: "caravanManagers.createSubtitle",
    };
  }
  if (pathname.includes("/location") && pathname.startsWith("/caravan-managers/")) {
    return {
      titleKey: "location.register",
      subtitleKey: "location.registerSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/caravan-managers/")) {
    return {
      titleKey: "caravanManagers.edit",
      subtitleKey: "caravanManagers.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/caravan-managers/") &&
    pathname !== "/caravan-managers"
  ) {
    return {
      titleKey: "caravanManagers.details",
      subtitleKey: "caravanManagers.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/caravan-managers")) {
    return {
      titleKey: "menus.caravanManagers",
      subtitleKey: "caravanManagers.subtitle",
    };
  }
  if (pathname.startsWith("/accommodation-managers/new")) {
    return {
      titleKey: "accommodationManagers.create",
      subtitleKey: "accommodationManagers.createSubtitle",
    };
  }
  if (
    pathname.includes("/location") &&
    pathname.startsWith("/accommodation-managers/")
  ) {
    return {
      titleKey: "location.register",
      subtitleKey: "location.registerSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/accommodation-managers/")
  ) {
    return {
      titleKey: "accommodationManagers.edit",
      subtitleKey: "accommodationManagers.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/accommodation-managers/") &&
    pathname !== "/accommodation-managers"
  ) {
    return {
      titleKey: "accommodationManagers.details",
      subtitleKey: "accommodationManagers.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/accommodation-managers")) {
    return {
      titleKey: "menus.accommodationManagers",
      subtitleKey: "accommodationManagers.subtitle",
    };
  }
  if (pathname.startsWith("/accommodation-year-management")) {
    return {
      titleKey: "menus.accommodationYearManagement",
      subtitleKey: "accommodationYearManagement.subtitle",
    };
  }
  if (pathname.startsWith("/accommodation-report")) {
    return {
      titleKey: "menus.accommodationReport",
      subtitleKey: "accommodations.reportSubtitle",
    };
  }
  if (pathname.startsWith("/my-accommodations/new")) {
    return {
      titleKey: "accommodations.create",
      subtitleKey: "myAccommodations.createSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/my-accommodations/")) {
    return {
      titleKey: "accommodations.edit",
      subtitleKey: "accommodations.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/my-accommodations/") &&
    pathname !== "/my-accommodations"
  ) {
    return {
      titleKey: "accommodations.details",
      subtitleKey: "accommodations.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/my-accommodations")) {
    return {
      titleKey: "menus.myAccommodations",
      subtitleKey: "myAccommodations.subtitle",
    };
  }
  if (pathname.startsWith("/accommodations/new")) {
    return {
      titleKey: "accommodations.create",
      subtitleKey: "accommodations.createSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/accommodations/")) {
    return {
      titleKey: "accommodations.edit",
      subtitleKey: "accommodations.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/accommodations/") &&
    pathname !== "/accommodations"
  ) {
    return {
      titleKey: "accommodations.details",
      subtitleKey: "accommodations.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/placements/vacate")) {
    return {
      titleKey: "placements.vacate",
      subtitleKey: "placements.vacateSubtitle",
    };
  }
  if (pathname.startsWith("/placements/") && pathname !== "/placements") {
    return {
      titleKey: "placements.details",
      subtitleKey: "placements.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/placements")) {
    return {
      titleKey: "menus.placement",
      subtitleKey: "placements.subtitle",
    };
  }
  if (pathname.startsWith("/accommodations")) {
    return {
      titleKey: "menus.accommodations",
      subtitleKey: "accommodations.subtitle",
    };
  }
  if (pathname.startsWith("/logistics/suppliers/new")) {
    return {
      titleKey: "suppliers.create",
      subtitleKey: "suppliers.createSubtitle",
    };
  }
  if (/\/logistics\/suppliers\/[^/]+\/items\/new$/.test(pathname)) {
    return {
      titleKey: "supplierItems.create",
      subtitleKey: "supplierItems.createSubtitle",
    };
  }
  if (/\/logistics\/suppliers\/[^/]+\/items\/[^/]+\/edit$/.test(pathname)) {
    return {
      titleKey: "supplierItems.edit",
      subtitleKey: "supplierItems.editSubtitle",
    };
  }
  if (/\/logistics\/suppliers\/[^/]+\/items\/[^/]+$/.test(pathname)) {
    return {
      titleKey: "supplierItems.details",
      subtitleKey: "supplierItems.detailsSubtitle",
    };
  }
  if (/\/logistics\/suppliers\/[^/]+\/items$/.test(pathname)) {
    return {
      titleKey: "supplierItems.title",
      subtitleKey: "supplierItems.subtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/logistics/suppliers/")
  ) {
    return {
      titleKey: "suppliers.edit",
      subtitleKey: "suppliers.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/logistics/suppliers/") &&
    pathname !== "/logistics/suppliers"
  ) {
    return {
      titleKey: "suppliers.details",
      subtitleKey: "suppliers.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/logistics/suppliers")) {
    return { titleKey: "menus.suppliers", subtitleKey: "suppliers.subtitle" };
  }
  if (pathname.startsWith("/logistics/loans/new")) {
    return {
      titleKey: "accommodationLoans.create",
      subtitleKey: "accommodationLoans.createSubtitle",
    };
  }
  if (pathname.includes("/edit") && pathname.startsWith("/logistics/loans/")) {
    return {
      titleKey: "accommodationLoans.edit",
      subtitleKey: "accommodationLoans.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/logistics/loans/") &&
    pathname !== "/logistics/loans"
  ) {
    return {
      titleKey: "accommodationLoans.details",
      subtitleKey: "accommodationLoans.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/logistics/loans")) {
    return {
      titleKey: "menus.loanManagement",
      subtitleKey: "accommodationLoans.subtitle",
    };
  }
  if (pathname.startsWith("/logistics/loan-report")) {
    return {
      titleKey: "menus.loanReport",
      subtitleKey: "loanReports.subtitle",
    };
  }
  if (pathname.startsWith("/logistics/item-quotas/new")) {
    return {
      titleKey: "itemQuotas.create",
      subtitleKey: "itemQuotas.createSubtitle",
    };
  }
  if (/\/logistics\/item-quotas\/[^/]+\/vouchers\/new$/.test(pathname)) {
    return {
      titleKey: "itemQuotaVouchers.create",
      subtitleKey: "itemQuotaVouchers.createSubtitle",
    };
  }
  if (
    /\/logistics\/item-quotas\/[^/]+\/vouchers\/[^/]+\/edit$/.test(pathname)
  ) {
    return {
      titleKey: "itemQuotaVouchers.edit",
      subtitleKey: "itemQuotaVouchers.editSubtitle",
    };
  }
  if (/\/logistics\/item-quotas\/[^/]+\/vouchers\/[^/]+$/.test(pathname)) {
    return {
      titleKey: "itemQuotaVouchers.details",
      subtitleKey: "itemQuotaVouchers.detailsSubtitle",
    };
  }
  if (/\/logistics\/item-quotas\/[^/]+\/vouchers$/.test(pathname)) {
    return {
      titleKey: "itemQuotaVouchers.title",
      subtitleKey: "itemQuotaVouchers.subtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/logistics/item-quotas/")
  ) {
    return {
      titleKey: "itemQuotas.edit",
      subtitleKey: "itemQuotas.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/logistics/item-quotas/") &&
    pathname !== "/logistics/item-quotas"
  ) {
    return {
      titleKey: "itemQuotas.details",
      subtitleKey: "itemQuotas.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/logistics/item-quotas")) {
    return { titleKey: "menus.itemQuotas", subtitleKey: "itemQuotas.subtitle" };
  }
  if (pathname.startsWith("/logistics/issue-voucher")) {
    return {
      titleKey: "menus.issueVoucher",
      subtitleKey: "itemQuotaVouchers.standaloneSubtitle",
    };
  }
  if (pathname.startsWith("/logistics/voucher-report")) {
    return {
      titleKey: "menus.voucherReport",
      subtitleKey: "voucherReports.subtitle",
    };
  }
  if (pathname.startsWith("/logistics/vouchers/new")) {
    return {
      titleKey: "itemQuotaVouchers.create",
      subtitleKey: "itemQuotaVouchers.standaloneSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/logistics/vouchers/")
  ) {
    return {
      titleKey: "itemQuotaVouchers.edit",
      subtitleKey: "itemQuotaVouchers.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/logistics/vouchers/") &&
    pathname !== "/logistics/vouchers"
  ) {
    return {
      titleKey: "itemQuotaVouchers.details",
      subtitleKey: "itemQuotaVouchers.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/logistics/vouchers")) {
    return {
      titleKey: "menus.voucherManagement",
      subtitleKey: "itemQuotaVouchers.adminSubtitle",
    };
  }
  if (
    pathname.startsWith("/logistics/my-vouchers/") &&
    pathname !== "/logistics/my-vouchers"
  ) {
    return {
      titleKey: "itemQuotaVouchers.details",
      subtitleKey: "myVouchers.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/logistics/my-vouchers")) {
    return { titleKey: "menus.myVouchers", subtitleKey: "myVouchers.subtitle" };
  }
  if (
    pathname.startsWith("/logistics/my-loans/") &&
    pathname !== "/logistics/my-loans"
  ) {
    return {
      titleKey: "accommodationLoans.details",
      subtitleKey: "myLoans.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/logistics/my-loans")) {
    return { titleKey: "menus.myLoans", subtitleKey: "myLoans.subtitle" };
  }
  if (pathname.startsWith("/logistics/settings")) {
    return {
      titleKey: "menus.logisticsSettings",
      subtitleKey: "logisticsSettings.subtitle",
    };
  }
  if (pathname.startsWith("/logistics/ice-voucher-report")) {
    return {
      titleKey: "menus.iceVoucherReport",
      subtitleKey: "iceVoucherReports.subtitle",
    };
  }
  if (pathname.startsWith("/logistics/ice-vouchers/new")) {
    return {
      titleKey: "iceVouchers.create",
      subtitleKey: "iceVouchers.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/logistics/ice-vouchers/")
  ) {
    return {
      titleKey: "iceVouchers.edit",
      subtitleKey: "iceVouchers.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/logistics/ice-vouchers/") &&
    pathname !== "/logistics/ice-vouchers"
  ) {
    return {
      titleKey: "iceVouchers.details",
      subtitleKey: "iceVouchers.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/logistics/ice-vouchers")) {
    return {
      titleKey: "menus.iceVouchers",
      subtitleKey: "iceVouchers.subtitle",
    };
  }
  if (pathname.startsWith("/logistics/my-ice-vouchers/new")) {
    return {
      titleKey: "iceVouchers.create",
      subtitleKey: "iceVouchers.createSubtitle",
    };
  }
  if (
    pathname.startsWith("/logistics/my-ice-vouchers/") &&
    pathname !== "/logistics/my-ice-vouchers"
  ) {
    return {
      titleKey: "iceVouchers.details",
      subtitleKey: "myIceVouchers.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/logistics/my-ice-vouchers")) {
    return {
      titleKey: "menus.myIceVouchers",
      subtitleKey: "myIceVouchers.subtitle",
    };
  }
  if (pathname.startsWith("/evaluations/campaigns/new")) {
    return {
      titleKey: "evaluations.campaigns.create",
      subtitleKey: "evaluations.campaigns.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/evaluations/campaigns/")
  ) {
    return {
      titleKey: "evaluations.campaigns.edit",
      subtitleKey: "evaluations.campaigns.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/evaluations/campaigns/") &&
    pathname !== "/evaluations/campaigns"
  ) {
    return {
      titleKey: "evaluations.campaigns.details",
      subtitleKey: "evaluations.campaigns.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/evaluations/campaigns")) {
    return {
      titleKey: "menus.evaluationCampaigns",
      subtitleKey: "evaluations.campaigns.subtitle",
    };
  }
  if (pathname.startsWith("/evaluations/questions/new")) {
    return {
      titleKey: "evaluations.questions.create",
      subtitleKey: "evaluations.questions.createSubtitle",
    };
  }
  if (
    pathname.includes("/edit") &&
    pathname.startsWith("/evaluations/questions/")
  ) {
    return {
      titleKey: "evaluations.questions.edit",
      subtitleKey: "evaluations.questions.editSubtitle",
    };
  }
  if (
    pathname.startsWith("/evaluations/questions/") &&
    pathname !== "/evaluations/questions"
  ) {
    return {
      titleKey: "evaluations.questions.details",
      subtitleKey: "evaluations.questions.detailsSubtitle",
    };
  }
  if (pathname.startsWith("/evaluations/questions")) {
    return {
      titleKey: "menus.evaluationQuestions",
      subtitleKey: "evaluations.questions.subtitle",
    };
  }
  if (pathname.startsWith("/evaluations/submit")) {
    return {
      titleKey: "menus.evaluationSubmit",
      subtitleKey: "evaluations.submit.subtitle",
    };
  }
  if (pathname.startsWith("/evaluations/") && pathname !== "/evaluations") {
    return {
      titleKey: "evaluations.details",
      subtitleKey: "evaluations.list.subtitle",
    };
  }
  if (pathname.startsWith("/evaluations")) {
    return {
      titleKey: "menus.evaluationsList",
      subtitleKey: "evaluations.list.subtitle",
    };
  }
  if (pathname.startsWith("/my-evaluations/") && pathname !== "/my-evaluations") {
    return {
      titleKey: "evaluations.details",
      subtitleKey: "evaluations.mine.subtitle",
    };
  }
  if (pathname.startsWith("/my-evaluations")) {
    return {
      titleKey: "menus.myEvaluations",
      subtitleKey: "evaluations.mine.subtitle",
    };
  }
  return { titleKey: "menus.overview", subtitleKey: "dashboard.subtitle" };
}
