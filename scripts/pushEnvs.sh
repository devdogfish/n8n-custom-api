# For each line in your .env file
while IFS='=' read -r key value; do
  [ -z "$key" ] || [ "${key:0:1}" = "#" ] && continue
  echo "$value" | vercel env add "$key" production
done < .env