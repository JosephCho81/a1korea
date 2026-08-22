/* 스크롤 애니메이션 */
(function(){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add('vis');
    });
  },{threshold:0.12});
  document.querySelectorAll('.fade-up,.fade-in').forEach(el=>io.observe(el));
})();
