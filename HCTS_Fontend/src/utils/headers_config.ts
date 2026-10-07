export const getToken = () => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return "";
  }

  const accessToken = window.localStorage.getItem("accesstoken");

  if (!accessToken) return ""; // no token stored

  try {
    const parsed = JSON.parse(accessToken);
    return parsed?.token ?? "";
  } catch (e) {
    console.error("Invalid token format:", e);
    return "";
  }
};

export const json_config ={
    headers:{
        'Content-Type':'application/json',
        Authorization: `Bearer ${getToken()}`,

    }
}

export const multipart_config = {
    headers:{
        'Content-Type':'multipart/form-data',
        Authorization: `Bearer ${getToken()}`,
    }
}
