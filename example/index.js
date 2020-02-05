const signal = require('../index')


signal.config({
  url:'http://192.168.50.5/services',
  auditorium:'test',
  name:'test-M001',
  signals:['testFunction']
})

signal.exec('testFunction',(next)=>{
  console.log('passou por mim')
  next({
    body:{
      data:{foo:'bar'},
      message:'Success',
      name:'Ok'
    },
    status:200,

  }).then((data)=>{
    console.log('deu certo')
  })
  .catch((err)=>{
    console.log('deu errado')
  })
})