export type Pet = {
  _id: string;
  name: string;
  breed?: string;
  age?: number;
  status?: string;
  images?: string[];
  organization?: any;
  listedBy?: any;
};
