import { useState } from "react";
import axios from 'axios'
function SignUp(){
    const [firstname,setFirstname]=useState('');
    const [lastname,setLastname]=useState('');
    const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');
  async  function handlesubmit(e){
   e.preventDefault()
     
    try {
           const response=await axios.post('http://localhost:4000/user/signup',{
        firstname:firstname,
        lastname:lastname,
        email:email,
        password:password
    })
    console.log(response.data)
    } catch (error) {
        console.log(error)
    }


   }
  
    return(
        <>
         <div style={{
            textAlign:'center',
           olor:'forestgreen'
         }}>SIGN UP</div>
        <div style={{
           marginLeft:'auto',
            marginRight:'auto',
            padding:'6px',
            borderRadius:'3px',
            border:'1px solid green',
            width:'200px',
            backgroundColor:'green',
            color:'white'
            
        }}>
           
            <form action="" onSubmit={handlesubmit} method="post">
                <label htmlFor="">firstName</label>
                <input 
                 style={{
                    margin:'3px'
                 }}
                 type="text"
                 value={firstname}
                 onChange={(e)=>setFirstname(e.target.value)}

                  />
                  <br />
                   <label htmlFor="">lastName</label>
                   <input
                    style={{
                    margin:'3px'
                 }}
                 type="text"
                 value={lastname}
                 onChange={(e)=>setLastname(e.target.value)}

                  />
                   <label htmlFor="">email</label>
                  <br />
                   <input
                    style={{
                    margin:'3px'
                 }}
                 type="text"
                 value={email}
                 onChange={(e)=>setEmail(e.target.value)}

                  />
                   <label htmlFor="">password</label>
                  <br />
                   <input
                    style={{
                    margin:'3px'
                 }}
                 type="text"
                 value={password}
                 onChange={(e)=>setPassword(e.target.value)}

                  />
                  <br />
                  
                  <input 
                   style={{
                    margin:'3px',
                    border:'none',
                    borderRadius:'3px',
                    backgroundColor:'white',
                    padding:'4px'
                   
                 }}
                  type="submit" />
            </form>
        </div>
        </>
    )
}
export default SignUp;