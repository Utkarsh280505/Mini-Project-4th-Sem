from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import verify_token
from app.schemas.user import (
    UserCreate, UserResponse, LoginRequest, Token,
    RefreshTokenRequest, PasswordChange
)
from app.models.user import User
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    auth_service = AuthService(db)
    user = auth_service.create_user(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name
    )
    return user


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return tokens"""
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(login_data.email, login_data.password)
    tokens = auth_service.create_tokens(user)
    return tokens


@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    payload = verify_token(refresh_data.refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    auth_service = AuthService(db)
    new_access_token = auth_service.refresh_access_token(payload.get("sub"))
    
    # Return both tokens (refresh token remains the same)
    return {
        "access_token": new_access_token,
        "refresh_token": refresh_data.refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user


@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    auth_service = AuthService(db)
    auth_service.change_password(
        current_user,
        password_data.current_password,
        password_data.new_password
    )
    return {"message": "Password changed successfully"}


@router.post("/logout")
def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Logged out successfully"}
