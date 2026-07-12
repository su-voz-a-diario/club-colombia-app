// src/services/notifications.js

import { isDemoActive } from "./resolver";
import * as DemoNotifications from "@/demo/notifications";
import * as FirebaseNotifications from "./firebase/notifications";

export const NotificationsService = {
  /**
   * Obtiene la lista de anuncios oficiales del club.
   * @returns {Promise<array>}
   */
  getClubAnnouncements: () => {
    return isDemoActive() 
      ? DemoNotifications.getClubAnnouncements() 
      : FirebaseNotifications.getClubAnnouncements();
  },

  /**
   * Suscribe a los comunicados en tiempo real.
   */
  subscribeToAnnouncements: (callback) => {
    return isDemoActive()
      ? DemoNotifications.subscribeToAnnouncements(callback)
      : FirebaseNotifications.subscribeToAnnouncements(callback);
  }
};
export default NotificationsService;
