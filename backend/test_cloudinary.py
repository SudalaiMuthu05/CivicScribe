import cloudinary

from config.settings import settings


print("Cloudinary configuration")
print("------------------------")
print(
    "Cloud name:",
    settings.cloudinary_cloud_name
)
print(
    "API key configured:",
    bool(settings.cloudinary_api_key)
)
print(
    "API secret configured:",
    bool(settings.cloudinary_api_secret)
)

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)

print("\nCloudinary configuration loaded successfully.")