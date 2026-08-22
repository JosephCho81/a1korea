/* 문의 폼 전송 */
function sendForm(){
  const name=document.getElementById('cf-name');
  const company=document.getElementById('cf-company');
  const email=document.getElementById('cf-email');
  const msg=document.getElementById('cf-msg');
  if(!name||!email||!msg) return;
  if(!name.value.trim()||!email.value.trim()||!msg.value.trim()){
    alert('이름, 이메일, 문의 내용을 입력해 주세요.');
    return;
  }
  alert('문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.');
  if(name) name.value='';
  if(company) company.value='';
  if(email) email.value='';
  if(msg) msg.value='';
}
