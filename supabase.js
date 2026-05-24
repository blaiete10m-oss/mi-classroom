const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL=https://cwryypcasunxrvqhyygu.supabase.co,  
  process.env.SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cnl5cGNhc3VueHJ2cWh5eWd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI2ODMwNiwiZXhwIjoyMDg2ODQ0MzA2fQ.VLeV5DcP9lBz5FSEM7QCSYt-o_-ufg0WcX84QGcUwzs
);

module.exports = supabase;
