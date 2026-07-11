// src/services/calendar.js

import { isDemoActive } from "./resolver";
import * as DemoCalendar from "@/demo/calendar";
import * as FirebaseCalendar from "./firebase/calendar";

export const CalendarService = {
  getCalendarEvents: () => {
    return isDemoActive() 
      ? DemoCalendar.getCalendarEvents() 
      : FirebaseCalendar.getCalendarEvents();
  },

  subscribeCalendarEvents: (categoryName, callback) => {
    return isDemoActive()
      ? DemoCalendar.subscribeCalendarEvents(categoryName, callback)
      : FirebaseCalendar.subscribeCalendarEvents(categoryName, callback);
  },

  updateRSVP: (eventId, studentName, response) => {
    return isDemoActive()
      ? DemoCalendar.updateRSVP(eventId, studentName, response)
      : FirebaseCalendar.updateRSVP(eventId, studentName, response);
  }
};
export default CalendarService;
