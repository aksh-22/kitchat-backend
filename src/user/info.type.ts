export type AppInfo = {
  appId: string;
  appName: string;
};

export type UserInfo = {
  userId: string;
  teamId: string;
  userFirstName: string;
  userLastName: string;
  userAvatar: string;
  userReferenceId: string;
};

export type TokenPayload = {
  appId: string;
  appName: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userAvatar: string;
  userReferenceId: string;
};
