/* eslint-disable react/prop-types */
import { createContext, useState, useEffect } from "react";
import DomoApi from "./DomoAPI";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [avatarKey, setAvatarKey] = useState("");
  const [customer, setCustomer] = useState("");
  const [host, setHost] = useState("");

  useEffect(() => {
    let isUserFetched = false;

    DomoApi.GetCurrentUser().then((data) => {
      // console.log("User Data",data);
      
      if (!isUserFetched) {
        const userId = data?.userId;
        const displayName = data?.displayName;
        const avatarKey = data?.avatarKey;
        const customer=data?.customer;
        const host=data?.host;

        setCurrentUser(displayName || "");
        setCurrentUserId(userId || "");
        setAvatarKey(avatarKey || "");
        setCustomer(customer || "");
        setHost(host || "");


        isUserFetched = true;
      }
    });

    return () => {
      isUserFetched = true;
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        currentUserId,
        avatarKey,
        customer,
        host
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
