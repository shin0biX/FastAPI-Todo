from fastapi import Depends,HTTPException,Path,APIRouter
from models import Users
from database import SessionLocal
from typing import Annotated
from sqlalchemy.orm import Session
from starlette import status
from pydantic import BaseModel , Field
from .auth import get_current_user,bcrypt_context

router = APIRouter(
        prefix='/users',
    tags=['users']
)

def get_db():
    db= SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session,Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

class UserVerification(BaseModel):
    password:str
    new_password:str = Field(min_length=6)

class PhoneVerification(BaseModel):
    new_number:str = Field(min_length=10)


@router.get("/get_user",status_code=status.HTTP_200_OK)
async def get_user(user:user_dependency,db:db_dependency):
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    model_user = db.query(Users).filter(Users.id==user.get('id')).first()
    return model_user

@router.put("/change_password",status_code=status.HTTP_202_ACCEPTED)
async def change_password(user:user_dependency,db:db_dependency,user_verification:UserVerification):
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    model_user = db.query(Users).filter(Users.id==user.get('id')).first()
    if not bcrypt_context.verify(user_verification.password, model_user.hashed_password):
        raise HTTPException(status_code=401 , detail="Error on password change")
    model_user.hashed_password = bcrypt_context.hash(user_verification.password)
    db.add(model_user)
    db.commit()
    
@router.put("/update_phone",status_code=status.HTTP_202_ACCEPTED)
async def update_phone_number(user:user_dependency,db:db_dependency,phone:str):
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    model_user = db.query(Users).filter(Users.id==user.get('id')).first()
    model_user.phone_number = phone
    db.add(model_user)
    db.commit()