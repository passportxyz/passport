export const STAMP_FILTERS: {
  [key: string]: {
    name: string;
    stamps: {
      [key: string]: string[];
    };
  };
} = {
  "bankless-academy": {
    name: "Bankless Academy",
    stamps: {
      Google: ["Account Name"],
      Ens: ["Account Name"],
      Poh: ["Account Name"],
      Twitter: ["Account Name"],
      Brightid: ["Account Name"],
      Linkedin: ["Account Name"],
      Discord: ["Account Name"],
    },
  },
};

export const getStampProviderFilters = (filter: string): any => {
  let stampFilters: any = false;
  if (Object.keys(STAMP_FILTERS).includes(filter)) {
    stampFilters = STAMP_FILTERS[filter].stamps;
  }
  return stampFilters;
};

export const getFilterName = (filter: string): any => {
  let filterName: any = false;
  if (Object.keys(STAMP_FILTERS).includes(filter)) {
    filterName = STAMP_FILTERS[filter].name;
  }
  return filterName;
};
