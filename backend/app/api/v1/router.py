from fastapi import APIRouter

from app.api.v1 import documents, imports, sharing, users

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(imports.router)
api_router.include_router(documents.router)
api_router.include_router(sharing.router)

