import { createClient } from "@supabase/supabase-js";
import config from "../../config";

const supabaseClient = createClient(config.SUPABASE_URL!, config.SUPABASE_KEY!);

export default supabaseClient;
