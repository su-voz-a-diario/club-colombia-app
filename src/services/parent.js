// src/services/parent.js

import { isDemoActive } from "./resolver";
import * as DemoParent from "@/demo/parent";
import * as FirebaseParent from "./firebase/parent";

export const ParentService = {
  getParentProfile: (uid) => {
    return isDemoActive() 
      ? DemoParent.getParentProfile(uid) 
      : FirebaseParent.getParentProfile(uid);
  },

  subscribeParentProfile: (uid, callback) => {
    return isDemoActive()
      ? DemoParent.subscribeParentProfile(uid, callback)
      : FirebaseParent.subscribeParentProfile(uid, callback);
  },

  updateParentPhone: (uid, phone) => {
    return isDemoActive() 
      ? DemoParent.updateParentPhone(uid, phone) 
      : FirebaseParent.updateParentPhone(uid, phone);
  },

  updateParentStatus: (uid, status) => {
    return isDemoActive()
      ? DemoParent.updateParentStatus(uid, status)
      : FirebaseParent.updateParentStatus(uid, status);
  }
};
export default ParentService;
