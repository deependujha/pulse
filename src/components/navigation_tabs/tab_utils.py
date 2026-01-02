# auto generate different tab files
import os


def generate_tab_file(tab_name: str) -> None:
    file_content = f"""export const {tab_name.capitalize()}Tab = () => {{
    return (
        <div>
            <div className="flex flex-col justify-center items-center h-full">
                <h1>{tab_name} Tab</h1>
            </div>
        </div>
    )
}}
"""
    # if file already exists, skip
    if os.path.exists(f"{tab_name.lower()}/{tab_name.lower()}_tab.tsx"):
        print(
            f"{tab_name.lower()}/{tab_name.lower()}_tab.tsx already exists, skipping... ❌"
        )
        return

    # write in file: tab_name/tab_name_tab.tsx
    os.makedirs(tab_name.lower(), exist_ok=True)
    with open(f"{tab_name.lower()}/{tab_name.lower()}_tab.tsx", "w") as f:
        f.write(file_content)

    print(f"Generated {tab_name.lower()}/{tab_name.lower()}_tab.tsx ✅")


def main():
    tab_names = ["Today", "Nutrition", "Training", "Care", "Insights", "Profile"]
    for tab_name in tab_names:
        generate_tab_file(tab_name)


if __name__ == "__main__":
    main()
