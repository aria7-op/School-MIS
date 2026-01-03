import re

input_path = "./students.sql"
output_path = "./students.sql"

with open(input_path, "r", encoding="utf-8") as f:
    sql = f.read()

# Pattern to find each INSERT INTO students ... VALUES block (including following tuples)
pattern = re.compile(
    r'(INSERT INTO students \(([^)]+)\) VALUES\s*)([\s\S]+?)(?=(?:INSERT INTO|$))',
    re.MULTILINE | re.DOTALL
)

def process_block(match):
    insert_head = match.group(1)
    columns_str = match.group(2)
    values_block = match.group(3)

    columns = [c.strip() for c in columns_str.split(",")]
    if "register_type" not in columns:
        try:
            sn_index = columns.index("S/N")
        except ValueError:
            sn_index = 0
        columns.insert(sn_index + 1, "register_type")
    else:
        sn_index = columns.index("S/N")
    new_columns_str = ", ".join(columns)

    # Split the values block into lines, process each tuple
    lines = [l for l in values_block.splitlines() if l.strip()]
    new_lines = []
    for line in lines:
        line_strip = line.strip()
        if not line_strip.startswith("("):
            new_lines.append(line)
            continue
        # Remove outer parentheses and trailing comma/semicolon
        tup_inner = line_strip.lstrip('(').rstrip('),;')
        vals = []
        current = ""
        in_quote = False
        escape = False
        for c in tup_inner:
            if escape:
                current += c
                escape = False
            elif c == "\\":
                current += c
                escape = True
            elif c == "'":
                in_quote = not in_quote
                current += c
            elif c == "," and not in_quote:
                vals.append(current.strip())
                current = ""
            else:
                current += c
        vals.append(current.strip())
        # Insert 'new' after S/N if not present
        if len(vals) == len(columns) - 1:
            vals.insert(sn_index + 1, "'new'")
        elif len(vals) == len(columns):
            pass  # Already has register_type
        else:
            vals.append("'new'")
        # Rebuild tuple
        rebuilt = "(" + ", ".join(vals) + ")"
        # Add back trailing comma/semicolon if present
        if line_strip.endswith(","):
            rebuilt += ","
        elif line_strip.endswith(";"):
            rebuilt += ";"
        new_lines.append(rebuilt)
    # Rebuild the block
    return f"INSERT INTO students ({new_columns_str}) VALUES\n" + "\n".join(new_lines) + "\n"

new_sql = pattern.sub(process_block, sql)

with open(output_path, "w", encoding="utf-8") as f:
    f.write(new_sql)

print("Done! Added 'new' as register_type for every tuple in students.sql, even for loose tuples.")
