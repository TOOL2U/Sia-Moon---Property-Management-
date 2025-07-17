#!/bin/bash

# File to modify
FILE="/Users/shaunducker/Desktop/Villa Management Bolt/src/app/onboard/page.tsx"

# Create a temporary file
TEMP_FILE=$(mktemp)

# Read the file and process each line
while IFS= read -r line; do
    # Skip lines that are already converted
    if [[ "$line" =~ "div className=\"space-y-2\"" ]] || [[ "$line" =~ "Label htmlFor=" ]]; then
        echo "$line" >> "$TEMP_FILE"
        continue
    fi
    
    # Check if line contains Input with label
    if [[ "$line" =~ \<Input[[:space:]]*label= ]]; then
        # Extract the label and other attributes
        label=$(echo "$line" | sed -E 's/.*label="([^"]*)".*$/\1/')
        name=$(echo "$line" | sed -E 's/.*name="([^"]*)".*$/\1/')
        
        # Get the indentation
        indent=$(echo "$line" | sed -E 's/^([[:space:]]*).*/\1/')
        
        # Start the div wrapper
        echo "${indent}<div className=\"space-y-2\">" >> "$TEMP_FILE"
        echo "${indent}  <Label htmlFor=\"$name\">$label</Label>" >> "$TEMP_FILE"
        
        # Remove label and error attributes, add id
        modified_line=$(echo "$line" | sed -E 's/label="[^"]*"[[:space:]]*//g')
        modified_line=$(echo "$modified_line" | sed -E 's/error=\{[^}]*\}[[:space:]]*//g')
        modified_line=$(echo "$modified_line" | sed -E "s/<Input/<Input\\n${indent}    id=\"$name\"/")
        
        echo "$modified_line" >> "$TEMP_FILE"
        
        # Add error display
        echo "${indent}  {validationErrors.$name && (" >> "$TEMP_FILE"
        echo "${indent}    <p className=\"text-sm text-red-500\">{validationErrors.$name}</p>" >> "$TEMP_FILE"
        echo "${indent}  )}" >> "$TEMP_FILE"
        echo "${indent}</div>" >> "$TEMP_FILE"
    else
        echo "$line" >> "$TEMP_FILE"
    fi
done < "$FILE"

# Replace the original file
mv "$TEMP_FILE" "$FILE"

echo "Input replacements complete"
