import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import APIError, { ErrorCodes } from "./error";

export const getOrThrowQuery = async <T>(
  pm: PostgrestFilterBuilder<T>,
  message?: string
) => {
  const { data, error } = await pm;

  if (error || !data)
    throw new APIError(
      error?.message || message || "Error occured",
      ErrorCodes.NOT_FOUND
    );

  return data;
};
