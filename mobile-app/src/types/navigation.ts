// Fixed: Navigation types for React Navigation
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  ActiveJobs: undefined;
  JobDetails: { job: any };
  JobCompletion: { job: any };
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
