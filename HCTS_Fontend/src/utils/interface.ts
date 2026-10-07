export interface InitialState{
    isLoading:boolean
    isSuccess:boolean
    isError:boolean
}

export interface Auth{
    email: string,
    password:string,
    role:string
}
export type User ={
    id:number
    firstName:string
    lastName:string
    phoneNumber:string
    email:string
    role:string
    status:string
    lastLoginAt:string
    createdAt:string
    updatedAt:string
}
export type Image ={
    id:number
    property_id:number
    image_url:string
}
export interface Paginate {
    total:number
    page:number
    limit:number
    totalPages:number
}